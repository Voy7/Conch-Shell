// Conch-Shell entry point

import { checkEnvVariables } from '#src/EnvVariables'
import Logger from '#src/Logger'
import packageJSON from '#root/package.json' assert { type: 'json' }
import '#src/bot'

// Clear console and print startup message
console.clear()
Logger.info(`Starting Conch-Shell v${packageJSON.version}...`)

// Run requirement checks
checkEnvVariables()