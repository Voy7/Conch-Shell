// Common type & enum definitions for project

import type {
  User,
  Guild,
  TextChannel,
  MessagePayload,
  MessageReplyOptions,
  Attachment,
  Collection,
  ApplicationCommandOptionType
} from 'discord.js'
import type ytdl from 'ytdl-core'

// Command class configuration shape
export type CommandConfig = {
  command: string,
  category: 'Unknown' | 'Music' | 'Misc',
  description: string,
  aliases?: string[],
  onlyInBotChannels?: boolean,
  onlyInSameVC?: boolean,
  args?: {
    type: 'String' | 'Integer' | 'Attachment' | 'Channel',
    name: string,
    description: string,
    isRequired: boolean
  }[]
}

// Common command input
export type CommandInput = {
  user: User,
  guild: Guild,
  textChannel: TextChannel,
  args: (string | null)[],
  attachment: Attachment | null,
  reply: (payload: string | MessagePayload | MessageReplyOptions) => Promise<void>,
  deleteMessage: () => Promise<void>
}

// Slash command data for registering on Discord
export type SlashCommandData = {
  name: string,
  description: string,
  options?: {
    type: ApplicationCommandOptionType,
    name: string,
    description: string,
    required: boolean
  }[]
}

// Playable types enum
export enum PlayableType { File, YouTube }

// Extra info for Playables, currently just for YouTube
export type PlayableExtraInfo = {
  videoInfo?: Video, // From simple-youtube-api.d.ts
  ytdlInfo?: ytdl.videoInfo,
  fileInfo?: FileInfo
}

export type FileInfo = {
  name: string,
  durationSeconds: number
}