import { getMusicPlayer } from '#src/audio/MusicPlayer'
import { CommandConfig, CommandInput } from '#src/types'

// Leave voice channel command
export const config: CommandConfig = {
  command: 'leave',
  category: 'Music',
  description: 'Disconnect bot from voice channel.',
  onlyInSameVC: true,
  onlyInBotChannels: true
}

export function run(input: CommandInput) {
  const player = getMusicPlayer(input.guild.id)
  const success = player?.disconnect()
  if (success) input.reply(':stop_button: `Stopping the music and disconnecting.`')
  else input.reply(':x: `Bot is not in a voice channel.`')
}