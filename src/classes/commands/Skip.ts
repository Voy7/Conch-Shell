import Command from '#src/classes/Command'
import BotHandler from '#src/classes/BotHandler'
import { CommandConfig, CommandInput } from '#src/types'

// Skip to next song command
export default class Skip extends Command {
  public config: CommandConfig = {
    command: 'skip',
    category: 'Music',
    description: 'Skip to next song in queue.',
    aliases: ['next']
  }

  public run(input: CommandInput) {
    const player = BotHandler.getMusicPlayer(input.guild.id)
    if (player && player.currentPlayable) {
      player.skip()
      input.reply(':track_next: `Skipping to next song.`')
    }
    else input.reply(':x: `Bot is not playing anything.`')
  }
}