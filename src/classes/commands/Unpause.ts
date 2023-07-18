import Command from '#src/classes/Command'
import BotHandler from '#src/classes/BotHandler'
import { CommandConfig, CommandInput } from '#src/types'

// Unpause/resume music command
export default class Unpause extends Command {
  public config: CommandConfig = {
    command: 'unpause',
    category: 'Music',
    description: 'Resume the music.',
    aliases: ['resume']
  }

  public run(input: CommandInput) {
    const player = BotHandler.getMusicPlayer(input.guild.id)
    if (player && player.currentPlayable) {
      player.unpause()
      input.reply(':play_pause: `Resuming the music.`')
    }
    else input.reply(':x: `Bot is not playing anything.`')
  }
}