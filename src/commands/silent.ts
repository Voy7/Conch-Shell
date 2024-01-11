import EnvVariables from '#src/EnvVariables'
import { getMusicPlayer } from '#src/audio/MusicPlayer'
import { CommandConfig, CommandInput } from '#src/types'

// Hide new songs messages from the channel
export const config: CommandConfig = {
  command: 'silent',
  category: 'Music',
  description: 'Hide new songs messages in the channel.',
  aliases: ['silence', 'shh', 'quiet'],
  onlyInSameVC: true,
  onlyInBotChannels: true
}

export function run(input: CommandInput) {
  if (EnvVariables.DISALLOW_SILENT_MODE) {
    input.reply(':x: `Silent Mode is disabled, sorry!`')
    return
  }

  const player = getMusicPlayer(input.guild.id)
  if (!player) {
    input.reply(':x: `Bot is not in the voice channel.`')
    return
  }

  if (player.isSilentMode) {
    player.isSilentMode = false
    input.reply(':sound: `Silent Mode disabled.`')
    return
  }
  
  player.isSilentMode = true
  input.reply(':mute: `Silent Mode enabled.`')
}