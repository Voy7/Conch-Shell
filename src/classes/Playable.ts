import { ChannelType, VoiceChannel } from 'discord.js'
import { CommandInput, PlayableType, PlayableExtraInfo } from '#src/types'

// Queue item Playable class
export default class Playable {
  public input: CommandInput
  public type: PlayableType
  public url: string
  public extraInfo?: PlayableExtraInfo

  constructor(input: CommandInput, type: PlayableType, url: string, extraInfo?: PlayableExtraInfo) {
    this.input = input
    this.type = type
    this.url = url
    this.extraInfo = extraInfo
  }

  get title(): string {
    if (this.type === PlayableType.File) {
      return this.url.split('/').pop() || 'Unknown File'
    }
    else if (this.type === PlayableType.YouTube) {
      return this.extraInfo?.title || 'Unknown Title'
    }
    return '[No Title Method]'
  }

  get duration(): number {
    if (this.type === PlayableType.File) {
      return 0
    }
    if (this.type === PlayableType.YouTube) {
      return this.extraInfo?.duration!
    }
    return 0
  }

  get thumbnail(): string {
    if (this.type === PlayableType.File) {
      return 'https://cdn.discordapp.com/attachments/692211326503616594/702426388573061150/file_icon.jpg'
    }
    if (this.type === PlayableType.YouTube) {
      return this.extraInfo?.thumbnails.high.url!
    }
    return 'https://cdn.discordapp.com/attachments/692211326503616594/702426388573061150/file_icon.jpg'
  }

  get channel(): string {
    if (this.type === PlayableType.File) {
      return 'N/A'
    }
    if (this.type === PlayableType.YouTube) {
      return this.extraInfo?.channel!.title!
    }
    return '[No Channel Method]'
  }
}