import Command from '#src/classes/Command'
import EnvVariables from '#src/classes/EnvVariables'
import BotHandler from '#src/classes/BotHandler'
import { CommandConfig, CommandInput } from '#src/types'

// Servers list command
export default class Servers extends Command {
  public config: CommandConfig = {
    command: 'servers',
    category: 'Misc',
    description: 'Show list of servers the bot is in.',
    aliases: ['guilds'],
  }

  public run(input: CommandInput) {
    input.reply({ embeds: [{
      title: `Server List (${BotHandler.client.guilds.cache.size})`,
      color: EnvVariables.EMBED_COLOR_1,
      fields: BotHandler.client.guilds.cache.map(guild => {
        return {
          name: guild.name,
          value:
            `Members: **${guild.memberCount}**\n` +
            `Joined: **${guild.joinedAt?.toLocaleDateString()}**`,
          inline: true
        }
      })
    }]})
  }
}