import Command from '#src/classes/Command'
import BotHandler from '#src/classes/BotHandler'
import EnvVariables from '#src/classes/EnvVariables'
import { CommandConfig, CommandInput } from '#src/types'

// Hide new songs messages from the channel
export default class Silent extends Command {
  public config: CommandConfig = {
    command: 'silent',
    category: 'Music',
    description: 'Hide new songs messages in the channel',
    aliases: ['silence', 'shh', 'quiet'],
    onlyInSameVC: true,
    onlyInBotChannels: true
  }

  public run(input: CommandInput) {
    if (EnvVariables.DISALLOW_SILENT_MODE) {
      input.reply(':x: `Silent Mode is disabled, sorry!`')
      return
    }

    const player = BotHandler.getMusicPlayer(input.guild.id)
    if (player) {
      if (player.isSilentMode) {
        player.isSilentMode = false
        input.reply(':mute: `Silent Mode disabled.`')
      }
      else {
        player.isSilentMode = true
        input.reply(':sound: `Silent Mode enabled.`')
      }
    }
    else input.reply(':x: `Bot is not in the voice channel.`')
  }
}