import ytdl from 'ytdl-core'
import YoutubeAPI from 'simple-youtube-api'
import Command from '#src/classes/Command'
import Logger from '#src/classes/Logger'
import EnvVariables from '#src/classes/EnvVariables'
import BotHandler from '#src/classes/BotHandler'
import Playable from '#src/classes/Playable'
import Utils from '#src/classes/Utils'
import { CommandConfig, CommandInput, PlayableType } from '#src/types'

// Play command
export default class Help extends Command {
  public config: CommandConfig = {
    command: 'play',
    category: 'Music',
    description: 'Play YouTube video or attached file.',
    aliases: ['p'],
    onlyInSameVC: true,
    onlyInBotChannels: true,
    args: [
      {
        type: 'String',
        name: 'query',
        description: 'YouTube video title or direct file URL.',
        isRequired: false
      },
      {
        type: 'Attachment',
        name: 'attachment',
        description: 'Audio or video file.',
        isRequired: false
      }
    ]
  }

  private youtubeAPI = new YoutubeAPI(EnvVariables.YOUTUBE_API_KEY)

  public async run(input: CommandInput) {
    // If no args or attachments, act as unpause command
    if (!input.args[0] && !input.attachment) {
      const unpause = BotHandler.commandsHandler?.commands.find(cmd => cmd.config.command === 'unpause')
      return unpause?.run(input)
    }

    const userVoiceChannel = Utils.getUserVoiceChannel(input.guild, input.user.id)
    if (!userVoiceChannel) {
      input.reply('You must be in a voice channel to use this command!')
      return
    }

    const musicPlayer = BotHandler.createMusicPlayer(input.guild, input.textChannel, userVoiceChannel)
    
    // If file is attached, add it to the queue
    if (input.attachment) {
      const playable = new Playable(input, PlayableType.File, input.attachment.url)
      musicPlayer.addPlayable(playable)
    }

    // If is a URL to a file (Any http(s) link with a audio/video file extension ending)
    else if (input.args[0]?.match(/^(http(s)?:\/\/).+\.(mp3|mp4|wav|ogg|webm|flac|mov|avi|wmv|mkv)$/)) {
      const playable = new Playable(input, PlayableType.File, input.args[0])
      musicPlayer.addPlayable(playable)
    }

    // If is a YouTube playlist URL
    else if (input.args[0]?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/playlist\?.+$/)) {
      input.reply(`:mag_right: \`Fetching playlist data for "${input.args[0]}", please wait...\``)

      const playlist = await this.youtubeAPI.getPlaylist(input.args[0])
      if (!playlist) return input.reply(`:x: \`Error: Could not get playlist info for "${input.args[0]}"\``)
      
      const videos: Video[] = await playlist.getVideos()
      if (videos.length === 0) return input.reply(`:x: \`Error: Playlist "${playlist.title}" contains no videos!\``)

      const ytdlInfo = await Promise.all(videos.map(video => ytdl.getInfo(video.url)))

      input.reply({ embeds: [{
        color: EnvVariables.EMBED_COLOR_1,
        description: `:track_next:  Added **${videos.length}** videos to the queue from playlist: [${playlist.title}](${playlist.url})`
      }]})

      videos.forEach((video, index) => {
        const playable = new Playable(input, PlayableType.YouTube, video.url, { videoInfo: video, ytdlInfo: ytdlInfo[index] }, true)
        musicPlayer.addPlayable(playable)
      })
    }
    
    // If is a YouTube URL
    else if (input.args[0]?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
      const [videoInfo, ytdlInfo] = await Promise.all([
        this.youtubeAPI.getVideo(input.args[0]),
        ytdl.getInfo(input.args[0])
      ])
      if (!videoInfo || !ytdlInfo) {
        return input.reply(`:x: \`Error: Could not get video info for "${input.args[0]}"\``)
      }
      const playable = new Playable(input, PlayableType.YouTube, input.args[0], { videoInfo, ytdlInfo })
      musicPlayer.addPlayable(playable)
    }

    // If all else fails, search for a YouTube video
    else {
      input.reply(`:mag_right: \`Searching "${input.args[0]}"...\``)
      try {
        const results = await this.youtubeAPI.searchVideos(input.args[0], 1)
        if (results.length > 0) {
          const ytdlInfo = await ytdl.getInfo(results[0].url)
          const playable = new Playable(input, PlayableType.YouTube, results[0].url, { videoInfo: results[0], ytdlInfo })
          musicPlayer.addPlayable(playable)
        }
        else input.reply(`:x: \`No search results found for: "${input.args[0]}"\``)
      }
      catch (error: any) {
        Logger.error(error.message)
        input.reply(`:x: \`Error: ${error.message}\``)
      }
    }
  }
}