import EnvVariables from '#src/EnvVariables'
import { getMusicPlayer } from '#src/audio/MusicPlayer'
import { CommandConfig, CommandInput } from '#src/types'

// Music queue command
export const config: CommandConfig = {
  command: 'queue',
  category: 'Music',
  description: 'Show the music queue.',
  aliases: ['q'],
  onlyInBotChannels: true
}

export function run(input: CommandInput) {
  const player = getMusicPlayer(input.guild.id)
  if (!player) {
    input.reply(':x: `Bot is not playing anything.`')
    return
  }
  if (!player.currentPlayable || player.queue.length <= 0) {
    input.reply(':x: `There is nothing in the queue.`')
    return
  }
  
  input.reply({ embeds: [{
    color: EnvVariables.EMBED_COLOR_1,
    thumbnail: { url: player.guild.iconURL()! },
    title: `Music Queue (${player.queue.length})`,
    description:
      `:arrow_forward: **[${player.currentPlayable.title}](${player.currentPlayable.url})**\n\n` +
      player.queue.map((playable, index) => {
        return `**#${index + 1}** - [${playable.title}](${playable.url})`
      }).join('\n')
  }]})
}