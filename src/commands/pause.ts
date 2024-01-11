import { getMusicPlayer } from '#src/audio/MusicPlayer'
import { CommandConfig, CommandInput } from '#src/types'

// Pause music command
export const config: CommandConfig = {
  command: 'pause',
  category: 'Music',
  description: 'Pause the music.',
  aliases: ['stop'],
  onlyInSameVC: true,
  onlyInBotChannels: true
}

export function run(input: CommandInput) {
  const player = getMusicPlayer(input.guild.id)
  if (!player?.currentPlayable) {
    input.reply(':x: `Bot is not playing anything.`')
    return
  }

  player.pause()
  input.reply(':pause_button: `Music now paused.`')
}