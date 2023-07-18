import { ChannelType, type Guild, type VoiceChannel } from 'discord.js'

export default class Utils {
  public static getUserVoiceChannel(guild: Guild, userID: string): VoiceChannel | null {
    let voiceChannel: VoiceChannel | null = null

    guild.channels.cache.forEach(channel => {
      if (channel.type === ChannelType.GuildVoice && channel.members.has(userID)) {
        voiceChannel = channel as VoiceChannel
      }
    })
    return voiceChannel
  }

  // Turn number into a formatted (1st, 2nd, etc) position string
  public static getParsedPosition(position: number): string {
    if (position == 1) return '1st'
    if (position == 2) return '2nd'
    if (position == 3) return '3rd'
    return `${position}th`
  }
}