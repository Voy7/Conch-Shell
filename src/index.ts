// Conch-Shell index file

import 'colors'

import Logger from '#src/classes/Logger'
import packageJSON from '#root/package.json' assert { type: 'json' }
import '#src/classes/BotHandler'

import { path } from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'
ffmpeg.setFfmpegPath(path)

// Clear console and print startup message
console.clear()
Logger.info(`Starting Conch-Shell v${packageJSON.version}...`)