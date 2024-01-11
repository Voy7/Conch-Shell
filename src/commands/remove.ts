import { getParsedPosition } from '#src/lib/utils'
import { getMusicPlayer } from '#src/audio/MusicPlayer'
import { CommandConfig, CommandInput } from '#src/types'

// Remove item from queue command
export const config: CommandConfig = {
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

export function run(input: CommandInput) {
  const player = getMusicPlayer(input.guild.id)
  if (!player?.currentPlayable) {
    input.reply(':x: `Bot is not playing anything.`')
    return
  }

  if (player.queue.length == 0) {
    input.reply(':x: `The queue is empty.`')
    return
  }

  const index = input.args[0] ? parseInt(input.args[0]) : null
  if (!index || index < 1 || index > player.queue.length) {
    input.reply(`:x: \`Provide a valid index ID. (1-${player.queue.length})\``)
    return
  }

  player.queue.splice(index - 1, 1)[0]
  input.reply(`:fire: \`Removed ${getParsedPosition(index)} item from the queue.\``)
}