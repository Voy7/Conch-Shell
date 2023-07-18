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
    
    // If is a YouTube URL
    else if (input.args[0]?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
      const videoInfo = await this.youtubeAPI.getVideo(input.args[0])
      if (!videoInfo) {
        return input.reply(`:x: \`Error: Could not get video info for "${input.args[0]}"\``)
      }
      const playable = new Playable(input, PlayableType.YouTube, input.args[0], videoInfo)
      musicPlayer.addPlayable(playable)
    }

    // If all else fails, search for a YouTube video
    else {
      input.reply(`:mag_right: \`Searching "${input.args[0]}"...\``)
      try {
        const results = await this.youtubeAPI.searchVideos(input.args[0], 1)
        if (results.length > 0) {
          const playable = new Playable(input, PlayableType.YouTube, results[0].url, results[0])
          musicPlayer.addPlayable(playable)
        }
      }
      catch (error: any) {
        Logger.error(error.message)
        input.reply(`:x: \`Error: ${error.message}\``)
      }
    }
  }
}