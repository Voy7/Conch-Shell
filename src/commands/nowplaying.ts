import EnvVariables from '#src/EnvVariables'
import { getParsedTimestamp } from '#src/lib/utils'
import { getMusicPlayer } from '#src/audio/MusicPlayer'
import { CommandConfig, CommandInput } from '#src/types'

// Show current song command
export const config: CommandConfig = {
  command: 'nowplaying',
  category: 'Music',
  description: 'Show current song info.',
  aliases: ['np'],
  onlyInBotChannels: true
}

export function run(input: CommandInput) {
  const player = getMusicPlayer(input.guild.id)
  if (!player?.currentPlayable) {
    input.reply(':x: `Bot is not playing anything.`')
    return
  }
  
  input.reply({ embeds: [{
    color: EnvVariables.EMBED_COLOR_1,
    thumbnail: { url: player.currentPlayable.thumbnail },
    title: `Now Playing`,
    fields: [
      {
        name: 'Title',
        value: `[${player.currentPlayable.title}](${player.currentPlayable.url})`
      },
      {
        name: 'Duration',
        value: `${getParsedTimestamp(player.currentPlayable.currentDuration)} / ${getParsedTimestamp(player.currentPlayable.totalDuration)}`,
        inline: true
      },
      {
        name: 'Channel',
        value: player.currentPlayable.channel,
        inline: true
      }
    ],
    footer: {
      text: `Requested by ${player.currentPlayable.input.user.username}`,
      icon_url: player.currentPlayable.input.user.avatarURL()!
    }
  }]})
}