import { getMusicPlayer } from '#src/audio/MusicPlayer'
import { CommandConfig, CommandInput } from '#src/types'

// Skip to next song command
export const config: CommandConfig = {
  command: 'skip',
  category: 'Music',
  description: 'Skip to next song in queue.',
  aliases: ['next'],
  onlyInSameVC: true,
  onlyInBotChannels: true
}

export function run(input: CommandInput) {
  const player = getMusicPlayer(input.guild.id)
  if (!player?.currentPlayable) {
    input.reply(':x: `Bot is not playing anything.`')
    return
  }

  player.skip()
  input.reply(':track_next: `Skipping to next song.`')
}