import EnvVariables from '#src/EnvVariables'
import { client } from '#src/bot'
import { CommandConfig, CommandInput } from '#src/types'

// Servers list command
export const config: CommandConfig = {
  command: 'servers',
  category: 'Misc',
  description: 'Show list of servers the bot is in.',
  aliases: ['guilds'],
}

export function run(input: CommandInput) {
  input.reply({ embeds: [{
    title: `Server List (${client.guilds.cache.size})`,
    color: EnvVariables.EMBED_COLOR_1,
    fields: client.guilds.cache.map(guild => {
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