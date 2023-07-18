import Command from '#src/classes/Command'
import EnvVariables from '#src/classes/EnvVariables'
import BotHandler from '#src/classes/BotHandler'
import { CommandConfig, CommandInput } from '#src/types'

// Show current song command
export default class NowPlaying extends Command {
  public config: CommandConfig = {
    command: 'nowplaying',
    category: 'Music',
    description: 'Show current song info.',
    aliases: ['np']
  }

  public run(input: CommandInput) {
    const player = BotHandler.getMusicPlayer(input.guild.id)
    if (player && player.currentPlayable) {
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
            value: `${player.currentPlayable.duration}`,
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
    else input.reply(':x: `Bot is not playing anything.`')
  }
}