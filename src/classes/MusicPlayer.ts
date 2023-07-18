import { Guild, TextChannel, VoiceChannel } from 'discord.js'
import * as voice from '@discordjs/voice'
import ytdl from 'ytdl-core'
import internal from 'stream'
import Logger from '#src/classes/Logger'
import EnvVariables from '#src/classes/EnvVariables'
import Playable from '#src/classes/Playable'
import Utils from '#src/classes/Utils'
import { PlayableType } from '#src/types'

// Music player class
export default class MusicPlayer {
  public guild: Guild
  public textChannel: TextChannel
  public voiceChannel: VoiceChannel
  public queue: Playable[] = []
  public currentPlayable: Playable | null = null
  
  private player: voice.AudioPlayer
  private connection: voice.VoiceConnection
  private ytStream: internal.Readable | null = null

  public readonly VOLUME_MULTIPLIER = 0.75

  constructor(guild: Guild, textChannel: TextChannel, voiceChannel: VoiceChannel) {
    this.guild = guild
    this.textChannel = textChannel
    this.voiceChannel = voiceChannel

    // Create audio player & connection
    this.player = new voice.AudioPlayer()
    this.connection = voice.joinVoiceChannel({
      guildId: this.guild.id,
      channelId: this.voiceChannel!.id,
      adapterCreator: this.guild.voiceAdapterCreator
    })
    this.connection.subscribe(this.player)

    // Listen for audio player events & errors
    this.player.on(voice.AudioPlayerStatus.Idle, () => {
      // connection.destroy()
      this.playNextInQueue()
    })

    this.player.on(voice.AudioPlayerStatus.Playing, () => {
      console.log('Playing')
    })

    this.player.on(voice.AudioPlayerStatus.Paused, () => {
      console.log('Paused')
    })

    // error
    this.player.on('error', error => {
      console.error(error)
    })
  }

  // Add a Playable to the queue, and play it if there's nothing playing
  public addPlayable(playable: Playable) {
    this.queue.push(playable)
    if (!this.currentPlayable) return this.playNextInQueue()

    // If there's already a song playing, send 'in queue' message
    playable.input.reply({ embeds: [{
      color: EnvVariables.EMBED_COLOR_1,
      description: `:track_next: ${Utils.getParsedPosition(this.queue.length)} in queue: [${playable.title}](${playable.url})`
    }]})
  }

  // Method to disconnect from VC, returns true if it was connected & successful
  public disconnect(): boolean {
    if (this.connection) {
      this.connection.destroy()
      return true
    }
    return false
  }

  // Method to pause the current song
  public pause() {
    if (this.player.state.status !== voice.AudioPlayerStatus.Playing) return
    this.player.pause()
  }

  // Method to resume the current song
  public unpause() {
    if (this.player.state.status !== voice.AudioPlayerStatus.Paused) return
    this.player.unpause()
  }

  // Method to skip to the next song in the queue
  public skip() {
    this.unpause()
    this.player.stop()
  }

  // Method to actually play the next song in the queue
  // Should only be called when there's nothing playing
  private playNextInQueue() {
    const playable = this.queue.shift()

    this.currentPlayable = playable || null

    if (!playable) {
      // TODO: Leave voice channel & send done msg
      this.textChannel.send(':white_check_mark: `Everything in the queue has been played.`')
      return
    }

    // console.log('url', playable.url)
    let resource: voice.AudioResource | null = null
    if (playable.type === PlayableType.File) {
      resource = voice.createAudioResource(playable.url, {
        // inputType: voice.StreamType.Arbitrary,
      })
    }
    else if (playable.type === PlayableType.YouTube) {
      this.ytStream = ytdl(playable.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25
      })
      resource = voice.createAudioResource(this.ytStream, {
        inlineVolume: true
      })
    }

    // Should never be null
    if (!resource) return Logger.error('Resource was somehow null')

    resource.volume?.setVolume(this.VOLUME_MULTIPLIER)
    this.player.play(resource)

    playable.input.reply({ embeds: [{
      color: EnvVariables.EMBED_COLOR_2,
      description: `:musical_note: Now playing in ${this.voiceChannel!.name}: [${playable.title}](${playable.url})`
    }]})
  }
}