import Command from '#src/classes/Command'
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
    input.reply(':x: `This command is not implemented yet.`')

    return // TODO
    
    // const player = BotHandler.getMusicPlayer(input.guild.id)
    // if (player && player.currentPlayable) {
    //   const time = parseInt(input.args[0] || '0')

    //   const seekTime = time * 1000
    //   const skipBytes = Math.floor(time * 48000 * 2 * 2); // 48000 samples per second, 2 bytes per sample, 2 channels (stereo)
    //   const audioStream = player.currentPlayable.resource.playStream

    //   audioStream.on('readable', () => {
    //     // Read and discard the first n bytes to skip to the desired time
    //     audioStream.read(skipBytes)
    //   })
      
    //   input.reply(`:fast_forward: \`Seeked to ${time}.\``)
    //   // input.reply(`:fast_forward: \`Seeked to ${Utils.getParsedTime(time)}.\``)
    // }
    // else input.reply(':x: `Bot is not playing anything.`')
  }
}