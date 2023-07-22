import * as voice from '@discordjs/voice'
import ytdl from 'ytdl-core'
import { CommandInput, PlayableType, PlayableExtraInfo } from '#src/types'

// Queue item Playable class
export default class Playable {
  public input: CommandInput
  public type: PlayableType
  public url: string
  public extraInfo?: PlayableExtraInfo
  public addSilent: boolean
  public resource: voice.AudioResource

  constructor(input: CommandInput, type: PlayableType, url: string, extraInfo?: PlayableExtraInfo, addSilent = false) {
    this.input = input
    this.type = type
    this.url = url
    this.extraInfo = extraInfo
    this.addSilent = addSilent

    // Create audio resource:
    if (this.type === PlayableType.YouTube) { // is YouTube video
      this.resource = voice.createAudioResource(ytdl(this.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25
      }), {
        inlineVolume: true
      })
    }
    else { // is (probably) File type
      this.resource = voice.createAudioResource(this.url)
    }
  }

  // Get the "title" of the Playable
  get title(): string {
    if (this.type === PlayableType.YouTube) {
      return this.extraInfo?.videoInfo.title || 'Unknown Title'
    }
    return this.url.split('/').pop() || 'Unknown File'
  }

  // Get current duration of the Playable in seconds, rounded down
  // If Playable hasn't started playing yet, duration will be 0
  get currentDuration(): number {
    return Math.floor(this.resource.playbackDuration / 1000)
  }

  // Get total/max duration of the Playable in seconds, rounded down
  get totalDuration(): number {
    if (this.type === PlayableType.YouTube) {
      return parseInt(this.extraInfo?.ytdlInfo.videoDetails.lengthSeconds!) || 0
    }
    return 0 // TODO: get duration of files
  }

  get thumbnail(): string {
    if (this.type === PlayableType.YouTube) {
      return this.extraInfo?.videoInfo.thumbnails.high.url!
    }
    return 'https://cdn.discordapp.com/attachments/692211326503616594/702426388573061150/file_icon.jpg'
  }

  get channel(): string {
    if (this.type === PlayableType.YouTube) {
      return this.extraInfo?.videoInfo.channel!.title!
    }
    return 'N/A'
  }
}