// Conch-Shell entry point

import Logger from '#src/classes/Logger'
import packageJSON from '#root/package.json' assert { type: 'json' }
import '#src/classes/BotHandler'

// Clear console and print startup message
console.clear()
Logger.info(`Starting Conch-Shell v${packageJSON.version}...`)