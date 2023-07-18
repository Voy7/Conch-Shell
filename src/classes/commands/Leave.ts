import Command from '#src/classes/Command'
import BotHandler from '#src/classes/BotHandler'
import { CommandConfig, CommandInput } from '#src/types'

// Leave voice channel command
export default class Leave extends Command {
  public config: CommandConfig = {
    command: 'leave',
    category: 'Music',
    description: 'Disconnect bot from voice channel.'
  }

  public run(input: CommandInput) {
    const player = BotHandler.getMusicPlayer(input.guild.id)
    const success = player?.disconnect()
    if (success) input.reply(':stop_button: `Stopping the music and disconnecting.`')
    else input.reply(':x: `Bot is not in a voice channel.`')
  }
}