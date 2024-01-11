// Conch-Shell entry point

import 'colors'
import { checkEnvVariables } from '#src/EnvVariables'
import { checkYouTubeAPIKey } from '#src/lib/youtubeAPI'
import { checkFfmpeg } from '#src/lib/ffmpeg'
import packageJSON from '#root/package.json' assert { type: 'json' }
import '#src/bot'

// Clear console and print startup message
console.clear()
console.log('\n  Starting ' + `Conch-Shell v${packageJSON.version}`.cyan + '... This may take a few seconds.\n')

// Run standalone requirement checks
checkEnvVariables()
checkYouTubeAPIKey()
checkFfmpeg()