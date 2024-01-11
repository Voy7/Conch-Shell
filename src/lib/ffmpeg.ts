import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import { path as ffprobePath } from '@ffprobe-installer/ffprobe'
import { passCheck, failCheck } from '#src/lib/requirements'
// Hacky way to only add the node ffprobe path is there isn't already a valid one installed

ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)
console.log(ffmpegPath, ffprobePath)

// Check if ffmpeg is installed by running a simple command
async function checkFfmpeg() {
  try {
    ffmpeg()
    passCheck('FfmpegValid', 'Ffmpeg is installed.')
  }
  catch (error) {
    failCheck('FfmpegValid', 'Ffmpeg is not installed.')
  }
}
checkFfmpeg()

export default ffmpeg