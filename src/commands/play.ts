import ytdl from 'ytdl-core'
import YoutubeAPI from 'simple-youtube-api'
import Logger from '#src/Logger'
import EnvVariables from '#src/EnvVariables'
import Playable from '#src/audio/Playable'
import ffmpeg from '#src/lib/ffmpeg'
import { getUserVoiceChannel } from '#src/lib/utils'
import { createMusicPlayer } from '#src/audio/MusicPlayer'
import { commands } from '#src/commands'
import { CommandConfig, CommandInput, PlayableType, FileInfo } from '#src/types'

export const config: CommandConfig = {
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

const youtubeAPI = new YoutubeAPI(EnvVariables.YOUTUBE_API_KEY)

export async function run(input: CommandInput) {
  // If no args or attachments, act as unpause command
  if (!input.args[0] && !input.attachment) {
    const unpause = commands.find(cmd => cmd.config.command === 'unpause')
    return unpause?.run(input)
  }

  const userVoiceChannel = getUserVoiceChannel(input.guild, input.user.id)
  if (!userVoiceChannel) {
    input.reply(':x: `You must be in a voice channel to use this command!`')
    return
  }

  const musicPlayer = createMusicPlayer(input.guild, input.textChannel, userVoiceChannel)
  
  // If file is attached, add it to the queue
  if (input.attachment) {
    const fileInfo = await getFileInfo(input.attachment.url)
    if (!fileInfo) {
      return input.reply(`:x: \`Error: The file provided is not valid.\``)
    }
    const playable = new Playable(input, PlayableType.File, input.attachment.url, { fileInfo })
    musicPlayer.addPlayable(playable)
    if (musicPlayer.isSilentMode) input.deleteMessage()
  }

  // If is a YouTube playlist URL
  else if (input.args[0]?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/playlist\?.+$/)) {
    if (!musicPlayer.isSilentMode) {
      input.reply(`:mag_right: \`Fetching playlist data for "${input.args[0]}", please wait...\``)
    }
    try {
      const playlist = await youtubeAPI.getPlaylist(input.args[0])
      if (!playlist) return input.reply(`:x: \`Error: Could not get playlist info for "${input.args[0]}"\``)
      
      const videos: Video[] = await playlist.getVideos()
      if (videos.length === 0) return input.reply(`:x: \`Error: Playlist "${playlist.title}" contains no videos!\``)

      const ytdlInfo = await Promise.all(videos.map(video => ytdl.getInfo(video.url)))

      if (!musicPlayer.isSilentMode) {
        input.reply({ embeds: [{
          color: EnvVariables.EMBED_COLOR_1,
          description: `:track_next:  Added **${videos.length}** videos to the queue from playlist: [${playlist.title}](${playlist.url})`
        }]})
      }

      videos.forEach((video, index) => {
        const playable = new Playable(input, PlayableType.YouTube, video.url, { videoInfo: video, ytdlInfo: ytdlInfo[index] }, true)
        musicPlayer.addPlayable(playable)
        if (musicPlayer.isSilentMode) input.deleteMessage()
      })
    }
    catch (error: any) { handleYouTubeError(error, input) }
  }
  
  // If is a YouTube URL
  else if (input.args[0]?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
    // For Youtube shorts, change the URL to the full video
    const isShorts = input.args[0]?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/shorts\/.+$/)
    const parsedURL = isShorts ? input.args[0].split('?')[0].replace('/shorts/', '/watch?v=') : input.args[0]
    
    // If URL contains ?t=, use it to start video at a specific time
    let startTime: number | null = null
    const url = new URL(input.args[0])
    const findTime = url.searchParams.get('t')
    if (findTime) startTime = parseInt(findTime)

    try {
      const [videoInfo, ytdlInfo] = await Promise.all([
        youtubeAPI.getVideo(parsedURL),
        ytdl.getInfo(parsedURL)
      ])
      if (!videoInfo || !ytdlInfo) {
        return input.reply(`:x: \`Error: Could not get video info for "${input.args[0]}"\``)
      }
      const playable = new Playable(input, PlayableType.YouTube, input.args[0], { videoInfo, ytdlInfo }, undefined, startTime || undefined)
      musicPlayer.addPlayable(playable)
      if (musicPlayer.isSilentMode) input.deleteMessage()
    }
    catch (error: any) { handleYouTubeError(error, input) }
  }

  // If is a URL starting with http(s)://, act as file URL
  else if (input.args[0]?.match(/^(https?:\/\/).+$/)) {
    const fileInfo = await getFileInfo(input.args[0])
    if (!fileInfo) {
      return input.reply(`:x: \`Error: The file provided is not valid.\``)
    }
    const playable = new Playable(input, PlayableType.File, input.args[0], { fileInfo })
    musicPlayer.addPlayable(playable)
    if (musicPlayer.isSilentMode) input.deleteMessage()
  }

  // If all else fails, search for a YouTube video
  else {
    if (!musicPlayer.isSilentMode) {
      input.reply(`:mag_right: \`Searching "${input.args[0]}"...\``)
    }
    try {
      const results = await youtubeAPI.searchVideos(input.args[0], 1)
      if (results.length > 0) {
        const ytdlInfo = await ytdl.getInfo(results[0].url)
        const playable = new Playable(input, PlayableType.YouTube, results[0].url, { videoInfo: results[0], ytdlInfo })
        musicPlayer.addPlayable(playable)
        if (musicPlayer.isSilentMode) input.deleteMessage()
      }
      else input.reply(`:x: \`No search results found for: "${input.args[0]}"\``)
    }
    catch (error: any) { handleYouTubeError(error, input) }
  }
}

// Get extra info from file
async function getFileInfo(url: string): Promise<FileInfo | null> {
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
function handleYouTubeError(error: any, input: CommandInput) {
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