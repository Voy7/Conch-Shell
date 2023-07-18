import { OAuth2Scopes } from 'discord.js'
import Command from '#src/classes/Command'
import EnvVariables from '#src/classes/EnvVariables'
import BotHandler from '#src/classes/BotHandler'
import packageJSON from '#root/package.json' assert { type: 'json' }
import { CommandConfig, CommandInput } from '#src/types'

// Help command
export default class Help extends Command {
  public config: CommandConfig = {
    command: 'help',
    category: 'Misc',
    description: 'Show the help menu',
    aliases: ['h', 'commands'],
  }

  private inviteLink = BotHandler.client.generateInvite({
    scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
    permissions: ['Administrator']
  })

  public run(input: CommandInput) {
    const musicCommands = BotHandler.commandsHandler?.commands.filter(cmd => cmd.config.category === 'Music') || []
    const miscCommands = BotHandler.commandsHandler?.commands.filter(cmd => cmd.config.category === 'Misc') || []
    
    input.reply({ embeds: [{
      title: 'Help Menu',
      color: EnvVariables.EMBED_COLOR_1,
      fields: [
        { name: ':notes: Music Commands', value: musicCommands.map(command => `\`${EnvVariables.BOT_PREFIX}${command.config.command}\``).join(', ') },
        { name: ':gear: Miscellaneous Commands', value: miscCommands.map(command => `\`${EnvVariables.BOT_PREFIX}${command.config.command}\``).join(', ') },
        { name: ':link: Bot Invite Link', value: `[Click here for an invite link](${this.inviteLink})` }
      ],
      footer: { text: `Made by Voy7 - Version ${packageJSON.version}` }
    }]})
  }
}