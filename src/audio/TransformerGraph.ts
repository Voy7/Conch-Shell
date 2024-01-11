import prism from 'prism-media'
import{ type Readable } from 'node:stream'

const FFMPEG_PCM_ARGUMENTS = [
  '-analyzeduration', '0', // Disable probing by ffmpeg
  '-loglevel', '0', // No logging
  '-f', 's16le', // To PCM 16-bit little-endian format
  '-ar', '48000', // 48KHz sampling rate
  '-ac', '2', // 2 channels (stereo)
]
const FFMPEG_OPUS_ARGUMENTS = [
	'-analyzeduration', '0', // Disable probing by ffmpeg
	'-loglevel', '0', // No logging
	'-acodec', 'libopus', // Use Opus codec
	'-f', 'opus', // To Opus format
	'-ar', '48000', // 48KHz sampling rate
	'-ac', '2', // 2 channels (stereo)
]

export enum StreamType {
	Arbitrary = 'arbitrary',
	Raw = 'raw',
	OggOpus = 'ogg/opus',
	WebmOpus = 'webm/opus',
	Opus = 'opus',
}

export enum TransformerType {
	FFmpegPCM = 'ffmpeg pcm',
	FFmpegOgg = 'ffmpeg ogg',
	OpusEncoder = 'opus encoder',
	OpusDecoder = 'opus decoder',
	OggOpusDemuxer = 'ogg/opus demuxer',
	WebmOpusDemuxer = 'webm/opus demuxer',
	InlineVolume = 'volume transformer',
}

export type Edge = {
	type: TransformerType,
	from: Node,
	to: Node,
	cost: number,
	transformer: (input: string | Readable, seekSeconds: number) => Readable
}

// Represents a type of stream within the graph, e.g. an Opus stream, or a stream of raw audio.
export class Node {
	public readonly edges: Edge[] = []
  public readonly type: StreamType

	constructor(type: StreamType) {
		this.type = type
	}

	public addEdge(edge: Omit<Edge, 'from'>) {
		this.edges.push({ ...edge, from: this })
	}
}

// Create a node for each stream type
const NODES = new Map<StreamType, Node>()
for (const streamType of Object.values(StreamType)) {
	NODES.set(streamType, new Node(streamType))
}

export function getNode(type: StreamType) {
	const node = NODES.get(type)
	if (!node) throw new Error(`Node type '${type}' does not exist!`)
	return node
}

getNode(StreamType.Raw).addEdge({
	type: TransformerType.OpusEncoder,
	to: getNode(StreamType.Opus),
	cost: 1.5,
	transformer: () => new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 }),
})

getNode(StreamType.Opus).addEdge({
	type: TransformerType.OpusDecoder,
	to: getNode(StreamType.Raw),
	cost: 1.5,
	transformer: () => new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 }),
})

getNode(StreamType.OggOpus).addEdge({
	type: TransformerType.OggOpusDemuxer,
	to: getNode(StreamType.Opus),
	cost: 1,
	transformer: () => new prism.opus.OggDemuxer(),
})

getNode(StreamType.WebmOpus).addEdge({
	type: TransformerType.WebmOpusDemuxer,
	to: getNode(StreamType.Opus),
	cost: 1,
	transformer: () => new prism.opus.WebmDemuxer(),
})

const FFMPEG_PCM_EDGE: Omit<Edge, 'from'> = {
	type: TransformerType.FFmpegPCM,
	to: getNode(StreamType.Raw),
	cost: 2,
	transformer: (input, seekSeconds) => {
    const args = [...FFMPEG_PCM_ARGUMENTS, '-ss', `${seekSeconds}`]
    return new prism.FFmpeg({
			args: typeof input === 'string' ? ['-i', input, ...args] : args,
		})
  }
}

getNode(StreamType.Arbitrary).addEdge(FFMPEG_PCM_EDGE)
getNode(StreamType.OggOpus).addEdge(FFMPEG_PCM_EDGE)
getNode(StreamType.WebmOpus).addEdge(FFMPEG_PCM_EDGE)

getNode(StreamType.Raw).addEdge({
	type: TransformerType.InlineVolume,
	to: getNode(StreamType.Raw),
	cost: 0.5,
	transformer: () => new prism.VolumeTransformer({ type: 's16le' }),
})

// Try to enable FFmpeg Ogg optimizations
function canEnableFFmpegOptimizations(): boolean {
	try {
		return prism.FFmpeg.getInfo().output.includes('--enable-libopus')
	} catch {}
	return false
}

if (canEnableFFmpegOptimizations()) {
	const FFMPEG_OGG_EDGE: Omit<Edge, 'from'> = {
		type: TransformerType.FFmpegOgg,
		to: getNode(StreamType.OggOpus),
		cost: 2,
		transformer: (input, seekSeconds) => {
      const args = [...FFMPEG_OPUS_ARGUMENTS, '-ss', `${seekSeconds}`]
      return new prism.FFmpeg({
				args: typeof input === 'string' ? ['-i', input, ...args] : args
			})
    }
	}
	getNode(StreamType.Arbitrary).addEdge(FFMPEG_OGG_EDGE)
	// Include Ogg and WebM as well in case they have different sampling rates or are mono instead of stereo
	// at the moment, this will not do anything. However, if/when detection for correct Opus headers is
	// implemented, this will help inform the voice engine that it is able to transcode the audio.
	getNode(StreamType.OggOpus).addEdge(FFMPEG_OGG_EDGE)
	getNode(StreamType.WebmOpus).addEdge(FFMPEG_OGG_EDGE)
}

// Represents a step in the path from node A to node B.
type Step = {
	next?: Step
  cost: number
	edge?: Edge
}

function findPath(
	from: Node,
	constraints: (path: Edge[]) => boolean,
	goal = getNode(StreamType.Opus),
	path: Edge[] = [],
	depth = 5,
): Step {
	if (from === goal && constraints(path)) {
		return { cost: 0 }
	}
  else if (depth === 0) {
		return { cost: Infinity }
	}

	let currentBest: Step | undefined = undefined
	for (const edge of from.edges) {
		if (currentBest && edge.cost > currentBest.cost) continue
		const next = findPath(edge.to, constraints, goal, [...path, edge], depth - 1)
		const cost = edge.cost + next.cost
		if (!currentBest || cost < currentBest.cost) {
			currentBest = { cost, edge, next }
		}
	}
	return currentBest ?? { cost: Infinity }
}

// Takes the solution from findPath and assembles it into a list of edges.
function constructPipeline(step: Step) {
	const edges = []
	let current: Step | undefined = step
	while (current?.edge) {
		edges.push(current.edge)
		current = current.next
	}
	return edges
}

// Finds the lowest-cost pipeline to convert the input stream type into an Opus stream.
export function findPipeline(from: StreamType, constraint: (path: Edge[]) => boolean): Edge[] {
  const node = getNode(from)
  const path = findPath(node, constraint)
  const pipeline = constructPipeline(path)
  return pipeline
}