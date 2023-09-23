import * as voice from '@discordjs/voice'
import ytdl from 'ytdl-core'
import BotHandler from '#src/classes/BotHandler'
import { CommandInput, PlayableType, PlayableExtraInfo } from '#src/types'
import { PassThrough } from 'stream'

// Import and set up ffmpeg
import ffmpeg from 'fluent-ffmpeg'
import { path } from '@ffmpeg-installer/ffmpeg'
ffmpeg.setFfmpegPath(path)

// Queue item "Playable" class
export default class Playable {
  public input: CommandInput
  public type: PlayableType
  public url: string
  public extraInfo?: PlayableExtraInfo
  public addSilent: boolean
  public resource: voice.AudioResource
  public startedTimeSeconds: number = 0

  public readonly VOLUME_MULTIPLIER = 0.75

  constructor(input: CommandInput, type: PlayableType, url: string, extraInfo?: PlayableExtraInfo, addSilent = false) {
    this.input = input
    this.type = type
    this.url = url
    this.extraInfo = extraInfo
    this.addSilent = addSilent

    // Create audio resource:
    this.resource = this.createAudioResource()
  }

  public createAudioResource(timeSeconds: number = 0): voice.AudioResource {
    this.startedTimeSeconds = timeSeconds
    let resource: voice.AudioResource

    if (this.type === PlayableType.YouTube) { // is YouTube video
      const stream = ffmpeg({ source: ytdl(this.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25
      })})
        .toFormat('wav')
        .setStartTime(timeSeconds)
        .inputOptions([ '-re' ])
        .pipe()
      resource = voice.createAudioResource(stream as any, {
        inlineVolume: true
      })
    }
    else { // is (probably) File type
      const stream = ffmpeg({ source: this.url })
        .toFormat('wav')
        .setStartTime(timeSeconds)
        .inputOptions([ '-re' ])
        .pipe()
      resource = voice.createAudioResource(stream as any)
    }
    resource.playStream.removeAllListeners()
    
    // Set a lower volume, 100% seems to cause clipping
    resource.volume?.setVolume(this.VOLUME_MULTIPLIER)

    // If the resource ended, reset it so it can be played again in loop mode
    resource.playStream.on('end', () => {
      const musicPlayer = BotHandler.getMusicPlayer(this.input.guild.id)
      if (musicPlayer?.isLoopMode) {
        this.resource = this.createAudioResource()
        this.resource.volume?.setVolume(this.VOLUME_MULTIPLIER)
      }
    })
    
    return resource
  }

  // Get the "title" of the Playable
  get title(): string {
    let title = 'Unknown Title'
    if (this.type === PlayableType.YouTube) {
      title = this.extraInfo?.videoInfo.title || 'Unknown Title'
    }
    else title = this.url.split('/').pop() || 'Unknown File'

    // Remove the most common HTML entities from the title
    title = title.replace(/&amp;/g, '&')
    title = title.replace(/&quot;/g, '"')
    title = title.replace(/&apos;/g, "'")
    title = title.replace(/&lt;/g, '<')
    title = title.replace(/&gt;/g, '>')

    return title
  }

  // Get current duration of the Playable in seconds, rounded down
  // If Playable hasn't started playing yet, duration will be 0
  get currentDuration(): number {
    return Math.floor((this.resource.playbackDuration / 1000) + this.startedTimeSeconds)
  }

  // Get total/max duration of the Playable in seconds, rounded down
  get totalDuration(): number {
    if (this.type === PlayableType.YouTube) {
      return parseInt(this.extraInfo?.ytdlInfo.videoDetails.lengthSeconds!) || 0
    }
    return 0 // TODO: get duration of files
  }

  // Get's the YouTube video's thumbnail URL, or a default file icon
  get thumbnail(): string {
    if (this.type === PlayableType.YouTube) {
      return this.extraInfo?.videoInfo.thumbnails.high.url!
    }
    return 'https://cdn.discordapp.com/attachments/692211326503616594/702426388573061150/file_icon.jpg'
  }

  // Get's the YouTube video's channel name, or "N/A"
  get channel(): string {
    if (this.type === PlayableType.YouTube) {
      return this.extraInfo?.videoInfo.channel!.title!
    }
    return 'N/A'
  }
}