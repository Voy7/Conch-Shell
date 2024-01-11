import { ChannelType, Guild, VoiceChannel } from 'discord.js'

// Collection of utility functions:

// Get the voice channel of a user in a guild
export function getUserVoiceChannel(guild: Guild, userID: string): VoiceChannel | null {
  let voiceChannel: VoiceChannel | null = null
  guild.channels.cache.forEach(channel => {
    if (channel.type === ChannelType.GuildVoice && channel.members.has(userID)) {
      voiceChannel = channel
    }
  })
  return voiceChannel
}

// Turn number into a formatted (1st, 2nd, etc) position string
export function getParsedPosition(position: number): string {
  if (position == 1) return '1st'
  if (position == 2) return '2nd'
  if (position == 3) return '3rd'
  return `${position}th`
}

// Turn seconds into a formatted (1:23:45) timestamp string
export function getParsedTimestamp(timeSeconds: number): string {
  const hours = Math.floor(timeSeconds / 3600)
  const minutes = Math.floor((timeSeconds - (hours * 3600)) / 60)
  const seconds = timeSeconds - (hours * 3600) - (minutes * 60)

  let timestamp = ''
  if (hours > 0) timestamp += `${hours}:`
  timestamp += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  return timestamp
}

// Turn an input timestamp string into seconds, or null if invalid
// Possible inputs: 90, 1:30, 01:30, 090, etc -> 90
export function timeStampToSeconds(timestamp: string): number | null {
  const timeParts = timestamp.split(':')
  if (timeParts.length > 3) return null

  let seconds = 0
  for (let i = 0; i < timeParts.length; i++) {
    const timePart = timeParts[timeParts.length - 1 - i]
    const timePartSeconds = parseInt(timePart)
    if (isNaN(timePartSeconds)) return null
    seconds += timePartSeconds * (60 ** i)
  }
  return seconds
}

// Parse most common HTML entities into their normal characters
const HTML_ENTITIES = {
  '&amp;': '&',
  '&quot;': '"',
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&#39;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#x60;': '`',
  '&#x3D;': '='
}
export function parseHTMLEntities(text: string): string {
  for (const [entity, replacement] of Object.entries(HTML_ENTITIES)) {
    text = text.replace(new RegExp(entity, 'g'), replacement)
  }
  return text
}