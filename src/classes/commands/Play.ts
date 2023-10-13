import ytdl from 'ytdl-core'
import YoutubeAPI from 'simple-youtube-api'
import Command from '#src/classes/Command'
import Logger from '#src/classes/Logger'
import EnvVariables from '#src/classes/EnvVariables'
import BotHandler from '#src/classes/BotHandler'
import Playable from '#src/classes/Playable'
import Utils from '#src/classes/Utils'
import { CommandConfig, CommandInput, PlayableType, FileInfo } from '#src/types'

// Import and set up ffmpeg
import ffmpeg from 'fluent-ffmpeg'
import { path as ffprobePath } from '@ffprobe-installer/ffprobe'
// If there isn't a global path set, set it to the local one
// if (!ffmpeg.getFfprobePath()) ffmpeg.setFfprobePath(ffprobePath)

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
      input.reply(':x: `You must be in a voice channel to use this command!`')
      return
    }

    const musicPlayer = BotHandler.createMusicPlayer(input.guild, input.textChannel, userVoiceChannel)
    
    // If file is attached, add it to the queue
    if (input.attachment) {
      const fileInfo = await this.getFileInfo(input.attachment.url)
      if (!fileInfo) {
        return input.reply(`:x: \`Error: The file provided is not valid.\``)
      }
      const playable = new Playable(input, PlayableType.File, input.attachment.url, { fileInfo })
      musicPlayer.addPlayable(playable)
    }

    // If is a YouTube playlist URL
    else if (input.args[0]?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/playlist\?.+$/)) {
      input.reply(`:mag_right: \`Fetching playlist data for "${input.args[0]}", please wait...\``)
      try {
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
      catch (error: any) { this.handleYouTubeError(error, input) }
    }
    
    // If is a YouTube URL
    else if (input.args[0]?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
      try {
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
      catch (error: any) { this.handleYouTubeError(error, input) }
    }

    // If is a URL starting with http(s)://, act as file URL
    else if (input.args[0]?.match(/^(https?:\/\/).+$/)) {
      const fileInfo = await this.getFileInfo(input.args[0])
      if (!fileInfo) {
        return input.reply(`:x: \`Error: The file provided is not valid.\``)
      }
      const playable = new Playable(input, PlayableType.File, input.args[0], { fileInfo })
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
      catch (error: any) { this.handleYouTubeError(error, input) }
    }
  }

  // Get extra info from file
  private async getFileInfo(url: string): Promise<FileInfo | null> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(url, (error, metadata) => {
        if (error) {
          Logger.warn(error)
          resolve(null)
          return
        }
        const name = metadata?.format?.filename ? metadata.format.filename.split('/').pop()?.split('?')[0] : null
        const durationSeconds = metadata?.format?.duration ? Math.floor(metadata.format.duration) : null
        if (!name || !durationSeconds) {
          Logger.warn('File info is missing some information.')
          resolve(null)
          return
        }
        resolve({ name, durationSeconds })
      })
    })
  }

  // Handle YouTube API error messages
  private handleYouTubeError(error: any, input: CommandInput) {
    Logger.warn(error)
    if (
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.startsWith('Status code')
    ) {
      // Is most likely from YouTube API
      const statusCode = error.message.split(' ')[2] || 'N/A'
      input.reply(`:x: \`Video is age-restricted or has a similar content restriction. (${statusCode})\``)
    }
    // Unknown origin, send generic error message
    else input.reply(`:x: \`Error in Play command: ${error}\``)
  }
}