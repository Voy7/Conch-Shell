import Command from '#src/classes/Command'
import BotHandler from '#src/classes/BotHandler'
import { CommandConfig, CommandInput } from '#src/types'

// Loop current item command
export default class Loop extends Command {
  public config: CommandConfig = {
    command: 'loop',
    category: 'Music',
    description: 'Loop the current item.',
    onlyInSameVC: true,
    onlyInBotChannels: true
  }

  public run(input: CommandInput) {
    const player = BotHandler.getMusicPlayer(input.guild.id)
    if (player && player.currentPlayable) {
      if (player.isLoopMode) {
        player.isLoopMode = false
        input.reply(':repeat: `Loop Mode disabled.`')
      }
      else {
        player.isLoopMode = true
        input.reply(':repeat: `Loop Mode enabled.`')
      }
    }
    else input.reply(':x: `Bot is not playing anything.`')
  }
}