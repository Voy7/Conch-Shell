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

// export interface CommandClass {
//   command: string,
//   description: string,
//   aliases: string[],
//   onlyInBotChannels: boolean,
//   onlyInSameVC: boolean,
//   run(message?: Message): void,
  
//   allAliases: string[]
// }

export type CommandConfig = {
  command: string,
  category: 'Unknown' | 'Music' | 'Misc',
  description: string,
  aliases?: string[],
  args?: {
    type: 'String' | 'Integer' | 'Attachment',
    name: string,
    description: string,
    isRequired: boolean
  }[],
  onlyInBotChannels?: boolean,
  onlyInSameVC?: boolean
}

export type CommandInput = {
  user: User,
  guild: Guild,
  textChannel: TextChannel,
  args: (string | null)[],
  attachment: Attachment | null,
  reply: (payload: string | MessagePayload | MessageReplyOptions) => Promise<void>
}

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

export enum PlayableType {
  File = 0,
  YouTube = 1
}

export type PlayableExtraInfo = Video // From simple-youtube-api.d.ts