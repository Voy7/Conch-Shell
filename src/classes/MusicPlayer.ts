import { Guild, TextChannel, VoiceChannel } from 'discord.js'
import * as voice from '@discordjs/voice'
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
  public isLoopMode: boolean = false
  
  private player: voice.AudioPlayer
  private connection: voice.VoiceConnection
  private ytStream: internal.Readable | null = null
  private isSkipping: boolean = false
  private leaveTimeout: NodeJS.Timeout | null = null

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
      this.playNextInQueue()
    })
    
    this.player.on('error', error => {
      this.textChannel.send(`:x: \`An error occurred while playing audio: ${error.message}\``)
      Logger.error(error)
    })
  }

  // Add a Playable to the queue, and play it if there's nothing playing
  public addPlayable(playable: Playable) {
    this.queue.push(playable)
    if (!this.currentPlayable) return this.playNextInQueue()

    // If there's already a song playing, send 'in queue' message
    if (playable.addSilent) return
    playable.input.reply({ embeds: [{
      color: EnvVariables.EMBED_COLOR_1,
      description: `:track_next: ${Utils.getParsedPosition(this.queue.length)} in queue: [${playable.title}](${playable.url})`
    }]})
    if (this.isLoopMode) playable.input.reply(':warning: `Warn: This item will not play until Loop Mode is disabled, or the current item is skipped.`')
  }

  // Method to disconnect from VC, returns true if it was connected & successful
  public disconnect(): boolean {
    try {
      this.connection.destroy()
      return true
    }
    catch (error) { return false }
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
    this.isSkipping = true
    this.unpause()
    this.player.stop()
  }

  // Method to actually play the next song in the queue
  // Should only be called when there's nothing playing
  private playNextInQueue() {
    const playable = this.isLoopMode && !this.isSkipping
      ? this.currentPlayable
      : this.queue.shift()

    this.currentPlayable = playable || null
    this.isSkipping = false
    
    if (this.leaveTimeout) clearTimeout(this.leaveTimeout)

    if (!playable) {
      this.isLoopMode = false
      
      this.textChannel.send(':white_check_mark: `Everything in the queue has been played.`')

      // If nothing is played for X minutes, leave the VC
      this.leaveTimeout = setTimeout(() => {
        this.disconnect()
      }, 1000 * 1800) // 30 minutes

      return
    }

    playable.resource.volume?.setVolume(this.VOLUME_MULTIPLIER)
    this.player.play(playable.resource)

    // Send 'now playing' message only if Loop Mode is false
    if (this.isLoopMode) return
    playable.input.reply({ embeds: [{
      color: EnvVariables.EMBED_COLOR_2,
      description: `:musical_note: Now playing in ${this.voiceChannel!.name}: [${playable.title}](${playable.url})`
    }]})
  }
}