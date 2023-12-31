import ytdl from 'ytdl-core'
import Command from '#src/classes/Command'
import EnvVariables from '#src/classes/EnvVariables'
import BotHandler from '#src/classes/BotHandler'
import Utils from '#src/classes/Utils'
import { CommandConfig, CommandInput } from '#src/types'

// Seek to specified time command
export default class Seek extends Command {
  public config: CommandConfig = {
    command: 'seek',
    category: 'Music',
    description: 'Seek to a specified time in the current song.',
    onlyInSameVC: true,
    onlyInBotChannels: true,
    args: [{
      type: 'Integer',
      name: 'timestamp',
      description: 'The timestamp to seek to.',
      isRequired: true
    }]
  }

  public run(input: CommandInput) {
    if (EnvVariables.PROJECT_MODE === 'production') {
      input.reply(':x: `This command is not implemented yet.`')
      return
    }

    const player = BotHandler.getMusicPlayer(input.guild.id)
    if (player) {
      if (!player.currentPlayable) {
        input.reply(':x: `Bot is not playing anything.`')
        return
      }

      if (!input.args[0]) {
        input.reply(':x: `Please specify a timestamp to seek to.`')
        return
      }

      const timeSeconds = Utils.timeStampToSeconds(input.args[0])
      
      if (timeSeconds === null) {
        input.reply(`:x: \`"${input.args[0]}" is not a valid timestamp.\``)
        return
      }

      player.seek(timeSeconds)
      input.reply(`:fast_forward: \`Seeking to ${Utils.getParsedTimestamp(timeSeconds)}...\``)
    }
    else input.reply(':x: `Bot is not playing anything.`')
  }
}