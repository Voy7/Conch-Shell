import Command from '#src/classes/Command'
import BotHandler from '#src/classes/BotHandler'
import Utils from '#src/classes/Utils'
import { CommandConfig, CommandInput } from '#src/types'

// Remove item from queue command
export default class Remove extends Command {
  public config: CommandConfig = {
    command: 'remove',
    category: 'Music',
    description: 'Remove an item from the queue.',
    onlyInSameVC: true,
    onlyInBotChannels: true,
    args: [{
      type: 'Integer',
      name: 'index',
      description: 'The index of the item to remove.',
      isRequired: true
    }]
  }

  public run(input: CommandInput) {
    const player = BotHandler.getMusicPlayer(input.guild.id)
    if (player && player.currentPlayable) {
      const index = parseInt(input.args[0] || '1')

      if (player.queue.length == 0) {
        input.reply(':x: `The queue is empty.`')
        return
      }
      
      if (index < 1 || index > player.queue.length) {
        input.reply(`:x: \`Provide a valid index ID. (1-${player.queue.length})\``)
        return
      }

      const removed = player.queue.splice(index - 1, 1)[0]
      input.reply(`:fire: \`Removed ${Utils.getParsedPosition(index)} item from the queue.\``)
    }
    else input.reply(':x: `Bot is not playing anything.`')
  }
}