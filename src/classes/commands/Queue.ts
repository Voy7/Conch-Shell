import Command from '#src/classes/Command'
import EnvVariables from '#src/classes/EnvVariables'
import BotHandler from '#src/classes/BotHandler'
import { CommandConfig, CommandInput } from '#src/types'

// Music queue command
export default class Queue extends Command {
  public config: CommandConfig = {
    command: 'queue',
    category: 'Music',
    description: 'Show the music queue.',
    aliases: ['q'],
  }

  public run(input: CommandInput) {
    const player = BotHandler.getMusicPlayer(input.guild.id)
    if (player) {
      if (player.currentPlayable && player.queue.length > 0) {
        input.reply({ embeds: [{
          color: EnvVariables.EMBED_COLOR_1,
          thumbnail: { url: player.guild.iconURL()! },
          title: `Music Queue (${player.queue.length})`,
          description:
            `:arrow_forward: **[${player.currentPlayable.title}](${player.currentPlayable.url})**\n\n` +
            player.queue.map((playable, index) => {
              return `**#${index + 1}** - [${playable.title}](${playable.url})`
            }).join('\n')
        }]})
      }
      else input.reply(':x: `There is nothing in the queue.`')
    }
    else {
      input.reply(':x: `There is no music queue.`')
    }
  }
}