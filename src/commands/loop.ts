import { getMusicPlayer } from '#src/audio/MusicPlayer'
import { CommandConfig, CommandInput } from '#src/types'

// Loop current item command
export const config: CommandConfig = {
  command: 'loop',
  category: 'Music',
  description: 'Loop the current item.',
  onlyInSameVC: true,
  onlyInBotChannels: true
}

export function run(input: CommandInput) {
  const player = getMusicPlayer(input.guild.id)
  if (!player?.currentPlayable) {
    input.reply(':x: `Bot is not playing anything.`')
    return
  }
  
  if (player.isLoopMode) {
    player.isLoopMode = false
    input.reply(':repeat: `Loop Mode disabled.`')
    return
  }
  
  player.isLoopMode = true
  input.reply(':repeat: `Loop Mode enabled.`')
}