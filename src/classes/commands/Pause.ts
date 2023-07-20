import Command from '#src/classes/Command'
import BotHandler from '#src/classes/BotHandler'
import { CommandConfig, CommandInput } from '#src/types'

// Pause music command
export default class Pause extends Command {
  public config: CommandConfig = {
    command: 'pause',
    category: 'Music',
    description: 'Pause the music.',
    aliases: ['stop'],
    onlyInSameVC: true,
    onlyInBotChannels: true
  }

  public run(input: CommandInput) {
    const player = BotHandler.getMusicPlayer(input.guild.id)
    if (player && player.currentPlayable) {
      player.pause()
      input.reply(':pause_button: `Music now paused.`')
    }
    else input.reply(':x: `Bot is not playing anything.`')
  }
}