import { ApplicationCommandOptionType, type Interaction, type Message } from 'discord.js'
import { readdirSync } from 'fs'
import { REST, Routes } from 'discord.js'
import EnvVariables from '#src/EnvVariables'
import Logger from '#src/Logger'
import { passCheck, failCheck } from '#src/lib/requirements'
import { client } from '#src/bot'
import { getMusicPlayer } from '#src/audio/MusicPlayer'
import { getUserVoiceChannel } from '#src/lib/utils'
import { Command, CommandInput, SlashCommandData } from '#src/types'

export const commands: Command[] = []

// Import all commands and register them on Discord as slash commands
// Also initialize messageCreate and interactionCreate events
export async function registerCommands() {
  Logger.debug('Initializing commands...')

  // Import all commands
  const files = readdirSync('./src/commands')
  for (const file of files) {
    const command = await import(`#src/commands/${file.split('.')[0]}`)
    commands.push({
      config: command.config,
      run: command.run,
      execute: (input: Message | Interaction) => executeCommand(command, input),
      allAliases: [command.config.command, ...(command.config.aliases || [])],
      slashCommandData: getSlashCommandData(command)
    })
  }

  // Register slash commands on Discord
  const rest = new REST().setToken(EnvVariables.BOT_TOKEN)
  try {
    Logger.debug('Registering application slash commands...')

    const commandsData: SlashCommandData[] = []

    commands.forEach(command => {
      command.allAliases.map(alias => {
        commandsData.push({ ...command.slashCommandData, name: alias })
      })
    })

    await rest.put(
      Routes.applicationCommands(EnvVariables.BOT_APPLICATION_ID), {
        body: commandsData
      }
    )

    passCheck('ApplicationIDValid', 'Application ID is valid.')
    passCheck('RegisteredCommands', `Successfully registered ${commands.length} application commands.`)
  }
  catch (error: any) {
    if (error.message.includes('application_id')) {
      return failCheck('ApplicationIDValid', 'Invalid application ID.')
    }
    else failCheck('RegisteredCommands', `Failed to register application commands. ${error.message}`)
  }

  // Register interactionCreate (slash commands) event
  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return
    const command = commands.find(command => command.allAliases.includes(interaction.commandName))
    if (!command) return
    command.execute(interaction)
  })

  // Register messageCreate event
  client.on('messageCreate', async message => {
    if (!message.guild) return
    if (message.author.bot) return
    if (message.channel.isDMBased()) return
    if (!message.content.startsWith(EnvVariables.BOT_PREFIX)) return

    const inputCommand = message.content.split(' ')[0].slice(EnvVariables.BOT_PREFIX.length).toLowerCase()
    
    commands.forEach(command => {
      if (!command.allAliases.includes(inputCommand)) return
      command.execute(message)
    })
  })
}

// Ultimately will run the command's run method, but will first turn the
// Message or Interaction into a common CommandInput object. Also, runs
// checks for 'onlyInBotChannels', 'onlyInSameVC', etc properties
export function executeCommand(command: Command, input: Message | Interaction): void | Promise<void> {
  const parsedInput: CommandInput = {
    // Type of input
    type: (() => {
      if ('author' in input) return 'Message'
      return 'Interaction'
    })(),

    // User who executed the command
    user: (() => {
      if ('author' in input) return input.author // is Message
      return input.user // is Interaction
    })(),

    // Guild command was executed in
    guild: input.guild!,

    // TextChannel command was executed in
    textChannel: input.channel as any, // Already checked is TextChannel

    // Command arguments
    args: (() => {
      if ('content' in input) { // is Message
        if (!command.config.args) return []
        // Every arg EXCEPT the last arg will always be '1 word', or null if not provided
        const content = input.content.split(' ').slice(1)
        const realArgs = command.config.args.filter(arg => arg.type !== 'Attachment')
        return realArgs.map((_, index) => {
          if (index === realArgs.length - 1) {
            return content.slice(index).join(' ') || null
          }
          return content[index] || null
        })
      }
      else { // is Interaction
        if (!input.isCommand()) return [] // Only used to typecast input into a SlashCommandInteraction
        return command.config.args?.map(arg => {
          const option = input.options.get(arg.name)
          if (!option) return null
          return option.value as string
        }) || []
      }
    })(),

    // Attached file, if any
    attachment: (() => {
      if ('attachments' in input) return input.attachments.first() || null // is Message
      else { // is Interaction
        if (!input.isCommand()) return null // Only used to typecast input into a SlashCommandInteraction
        return input.options.getAttachment('attachment') || null
      }
    })(),

    // Method to reply/send a message in the correct channel
    reply: async (payload) => {
      let message: Message | undefined
      if ('author' in input) { // is Message
        message = await input.channel.send(payload)
      }
      else { // is Interaction
        if (!input.isCommand()) return // Never happens, only used to typecast input into a SlashCommandInteraction
        if (input.replied) message = await input.channel?.send(payload)
        else message = await input.reply(payload as any) // MessageReplyOptions 99% of cases will be a valid InteractionReplyOptions object
      }
      return message
    },

    // Method to delete user's message, only does something if interaction was a message
    deleteMessage: async () => {
      if (!('delete' in input)) return
      try {
        await input.delete()
      }
      catch (error: any) { // Could throw error if message was already deleted, so ignore it
        Logger.warn(`Could not delete message: ${error.message}`)
      }
    }
  }

  // If command has 'onlyInSameVC' property, check if executor is in same VC as bot
  if (command.config.onlyInSameVC) {
    const userVoiceChannel = getUserVoiceChannel(parsedInput.guild, parsedInput.user.id)
    const botVoiceChannel = getMusicPlayer(parsedInput.guild.id)?.voiceChannel
    if (userVoiceChannel && botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
      parsedInput.reply(':x: `You must be in the same voice channel as the bot!`')
      return
    }
  }

  // If command has 'onlyInBotChannels' property, check if command was executed in a bot/music channel
  if (command.config.onlyInBotChannels) {
    const name = parsedInput.textChannel.name.toLowerCase()
    if (!name.includes('bot') && !name.includes('music')) {
      parsedInput.reply(':x: `This command can only be used in bot/music channels!`')
      return
    }
  }

  // Run the command with the ussable parsed input
  command.run(parsedInput)
}

// Returns the command's data in the format required by Discord to register a slash command
export function getSlashCommandData(command: Command): SlashCommandData {
  return {
    name: command.config.command,
    description: command.config.description,
    options: command.config.args?.map(arg => ({
      type: (() => {
        switch (arg.type) {
          case 'String': return ApplicationCommandOptionType.String
          case 'Integer': return ApplicationCommandOptionType.Integer
          case 'Attachment': return ApplicationCommandOptionType.Attachment
          case 'Channel': return ApplicationCommandOptionType.Channel
          default: return ApplicationCommandOptionType.String
        }
      })(),
      name: arg.name,
      description: arg.description,
      required: arg.isRequired
    })) || []
  }
}