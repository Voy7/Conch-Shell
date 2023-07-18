// Import all modules in /commands/ and register them

import { readdirSync } from 'fs'
// import { join } from 'path'
import { REST, Routes } from 'discord.js'
import BotHandler from '#src/classes/BotHandler'
import EnvVariables from '#src/classes/EnvVariables'
import Logger from '#src/classes/Logger'
// import type { CommandClass } from '#src/types'

import type Command from '#src/classes/Command'
import { SlashCommandData } from '#src/types'

export default class CommandsHandler {
  public commands: Command[] = []

  constructor() {
    this.initializeCommands()

    // Register messageCreate event
    BotHandler.client.on('messageCreate', async message => {
      if (!message.guild) return
      if (message.author.bot) return
      if (message.channel.isDMBased()) return
      if (!message.content.startsWith(EnvVariables.BOT_PREFIX)) return

      const inputCommand = message.content.split(' ')[0].slice(EnvVariables.BOT_PREFIX.length).toLowerCase()
      
      this.commands.forEach(command => {
        if (!command.allAliases.includes(inputCommand)) return
        command.execute(message)
      })
    })

    // Register interactionCreate event
    BotHandler.client.on('interactionCreate', async interaction => {
      if (!interaction.isCommand()) return

      const command = this.commands.find(command => command.allAliases.includes(interaction.commandName))

      command?.execute(interaction)
    })
  }

  private async initializeCommands() {
    Logger.info('Initializing commands...')

    const files = readdirSync('./src/classes/commands')
    for (const file of files) {
      const commandClass = new (await import(`#src/classes/commands/${file.split('.')[0]}`)).default() as Command

      this.commands.push(commandClass)
    }

    // Register commands on Discord
    const rest = new REST().setToken(EnvVariables.BOT_TOKEN)
    try {
      Logger.info('Registering application slash commands...')

      const commandsData: SlashCommandData[] = []

      this.commands.forEach(command => {
        command.allAliases.map(alias => {
          commandsData.push({ ...command.slashCommandData, name: alias })
        })
      })

      await rest.put(
        Routes.applicationCommands(EnvVariables.BOT_APPLICATION_ID), {
          body: commandsData
        }
      )

      Logger.info('Successfully registered application slash commands.')
    }
    catch (error) { Logger.error(error) }
  }
}