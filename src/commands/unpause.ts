import { getMusicPlayer } from '#src/audio/MusicPlayer'
import { CommandConfig, CommandInput } from '#src/types'

// Unpause/resume music command
export const config: CommandConfig = {
  command: 'unpause',
  category: 'Music',
  description: 'Resume the music.',
  aliases: ['resume'],
  onlyInSameVC: true,
  onlyInBotChannels: true
}

export function run(input: CommandInput) {
  const player = getMusicPlayer(input.guild.id)
  if (!player?.currentPlayable) {
    input.reply(':x: `Bot is not playing anything.`')
    return
  }
  
  player.unpause()
  input.reply(':play_pause: `Resuming the music.`')
}