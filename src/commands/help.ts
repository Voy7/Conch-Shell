import { OAuth2Scopes } from 'discord.js'
import EnvVariables from '#src/EnvVariables'
import { client } from '#src/bot'
import { commands } from '#src/commands'
import packageJSON from '#root/package.json' assert { type: 'json' }
import { CommandConfig, CommandInput } from '#src/types'

// Help command
export const config: CommandConfig = {
  command: 'help',
  category: 'Misc',
  description: 'Show the help menu.',
  aliases: ['h', 'commands']
}

const inviteLink = client.generateInvite({
  scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
  permissions: ['Administrator']
})

export function run(input: CommandInput) {
  const musicCommands = commands.filter(cmd => cmd.config.category === 'Music') || []
  const miscCommands = commands.filter(cmd => cmd.config.category === 'Misc') || []
  
  input.reply({ embeds: [{
    title: 'Help Menu',
    color: EnvVariables.EMBED_COLOR_1,
    fields: [
      { name: ':notes: Music Commands', value: musicCommands.map(command => `\`${EnvVariables.BOT_PREFIX}${command.config.command}\``).join(', ') },
      { name: ':gear: Miscellaneous Commands', value: miscCommands.map(command => `\`${EnvVariables.BOT_PREFIX}${command.config.command}\``).join(', ') },
      { name: ':link: Bot Invite Link', value: `[Click here for an invite link](${inviteLink})` },
      { name: ':computer: Source Code', value: `[View source code on GitHub](${packageJSON.repository.url})` }
    ],
    footer: { text: `Made by ${packageJSON.author} • Version ${packageJSON.version}` }
  }]})
}