import prism from 'prism-media'
import { pipeline, Readable } from 'node:stream'
import { Edge, findPipeline, StreamType, TransformerType } from '#src/audio/TransformerGraph'

// Options that are set when creating a new audio resource.
export type CreateAudioResourceOptions = {
	inputType?: StreamType
  inlineVolume?: boolean
  silencePaddingFrames?: number
  seekSeconds?: number
}

// Represents an audio resource that can be played by an audio player.
// T = the type for the metadata (if any) of the audio resource
export class AudioResource {
	public readonly playStream: Readable
  public readonly edges: readonly Edge[]
  public readonly volume?: prism.VolumeTransformer
  public readonly encoder?: prism.opus.Encoder
  public audioPlayer?: any//AudioPlayer
  public playbackDuration = 0
  public started = false
  public readonly silencePaddingFrames: number
  public silenceRemaining = -1

	constructor(edges: readonly Edge[], streams: readonly Readable[], silencePaddingFrames: number) {
		this.edges = edges
		this.playStream = streams.length > 1 ? (pipeline(streams, () => {}) as any as Readable) : streams[0]
		this.silencePaddingFrames = silencePaddingFrames

		for (const stream of streams) {
			if (stream instanceof prism.VolumeTransformer) {
				this.volume = stream
			}
      else if (stream instanceof prism.opus.Encoder) {
				this.encoder = stream
			}
		}

		this.playStream.once('readable', () => {
      this.started = true
    })
	}

	// Whether this resource is readable.
	public get readable(): boolean {
		if (this.silenceRemaining === 0) return false
		const real = this.playStream.readable
		if (!real) {
			if (this.silenceRemaining === -1) this.silenceRemaining = this.silencePaddingFrames
			return this.silenceRemaining !== 0
		}
		return real
	}

	// Whether this resource has ended or not.
	public get ended(): boolean {
		return this.playStream.readableEnded || this.playStream.destroyed || this.silenceRemaining === 0
	}


  // Attempts to read an Opus packet from the audio resource. If a packet is available, the playbackDuration
  // is incremented.
	public read(): Buffer | null {
		if (this.silenceRemaining === 0) {
			return null
		} else if (this.silenceRemaining > 0) {
			this.silenceRemaining--
      const silenceFrame = Buffer.from([0xf8, 0xff, 0xfe])
			return silenceFrame
		}
		const packet: Buffer | null = this.playStream.read()
		if (packet) {
			this.playbackDuration += 20
		}
		return packet
	}
}

// Ensures that a path contains at least one volume transforming component.
export const VOLUME_CONSTRAINT = (path: Edge[]) => path.some((edge) => edge.type === TransformerType.InlineVolume)

export const NO_CONSTRAINT = () => true

// Tries to infer the type of a stream to aid with transcoder pipelining.
export function inferStreamType(stream: Readable): {
	streamType: StreamType
	hasVolume: boolean
} {
	if (stream instanceof prism.opus.Encoder) {
		return { streamType: StreamType.Opus, hasVolume: false }
	} else if (stream instanceof prism.opus.Decoder) {
		return { streamType: StreamType.Raw, hasVolume: false }
	} else if (stream instanceof prism.VolumeTransformer) {
		return { streamType: StreamType.Raw, hasVolume: true }
	} else if (stream instanceof prism.opus.OggDemuxer) {
		return { streamType: StreamType.Opus, hasVolume: false }
	} else if (stream instanceof prism.opus.WebmDemuxer) {
		return { streamType: StreamType.Opus, hasVolume: false }
	}
	return { streamType: StreamType.Arbitrary, hasVolume: false }
}

// Creates an audio resource that can be played by audio players.
// If the input is given as a string, then the inputType option will be overridden and FFmpeg will be used.
// If the input is not in the correct format, then a pipeline of transcoders and transformers will be created
// to ensure that the resultant stream is in the correct format for playback. This could involve using FFmpeg,
// Opus transcoders, and Ogg/WebM demuxers.
export function createAudioResource(input: string | Readable, options: CreateAudioResourceOptions = {}): AudioResource {
	let inputType = options.inputType
	let needsInlineVolume = Boolean(options.inlineVolume)

  const seekSeconds = options.seekSeconds ?? 0

	// string inputs can only be used with FFmpeg
	if (typeof input === 'string') {
		inputType = StreamType.Arbitrary
	} else if (typeof inputType === 'undefined') {
		const analysis = inferStreamType(input)
		inputType = analysis.streamType
		needsInlineVolume = needsInlineVolume && !analysis.hasVolume
	}

	const transformerPipeline = findPipeline(inputType, needsInlineVolume ? VOLUME_CONSTRAINT : NO_CONSTRAINT)

	if (transformerPipeline.length === 0) {
		if (typeof input === 'string') throw new Error(`Invalid pipeline constructed for string resource '${input}'`)
		// No adjustments required
		return new AudioResource([], [input], options.silencePaddingFrames ?? 5)
	}
	const streams = transformerPipeline.map((edge) => edge.transformer(input, seekSeconds))
	if (typeof input !== 'string') streams.unshift(input)

	return new AudioResource(
		transformerPipeline,
		streams,
		options.silencePaddingFrames ?? 5
	)
}