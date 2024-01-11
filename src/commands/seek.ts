import EnvVariables from '#src/EnvVariables'
import { timeStampToSeconds, getParsedTimestamp } from '#src/lib/utils'
import { getMusicPlayer } from '#src/audio/MusicPlayer'
import { CommandConfig, CommandInput } from '#src/types'

// Seek to specified time command
export const config: CommandConfig = {
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

export function run(input: CommandInput) {
  const player = getMusicPlayer(input.guild.id)
  if (!player?.currentPlayable) {
    input.reply(':x: `Bot is not playing anything.`')
    return
  }

  if (!input.args[0]) {
    input.reply(':x: `Please specify a timestamp to seek to.`')
    return
  }

  const timeSeconds = timeStampToSeconds(input.args[0])
  if (timeSeconds === null) {
    input.reply(`:x: \`"${input.args[0]}" is not a valid timestamp.\``)
    return
  }

  player.seek(timeSeconds)
  input.reply(`:fast_forward: \`Seeking to ${getParsedTimestamp(timeSeconds)}...\``)
}