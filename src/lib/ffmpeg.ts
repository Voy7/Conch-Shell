import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import { path as ffprobePath } from '@ffprobe-installer/ffprobe'
import EnvVariables from '#src/EnvVariables'
import { passCheck, failCheck } from '#src/lib/requirements'

// Set the ffmpeg and ffprobe path to either the custom path, or default to built-in module
if (EnvVariables.FFMPEG_PATH) ffmpeg.setFfmpegPath(EnvVariables.FFMPEG_PATH)
else ffmpeg.setFfmpegPath(ffmpegPath)
if (EnvVariables.FFPROBE_PATH) ffmpeg.setFfprobePath(EnvVariables.FFPROBE_PATH)
else ffmpeg.setFfprobePath(ffprobePath)

// Check if ffmpeg & ffprobe is installed by running a simple command
export async function checkFfmpeg() {
  try {
    ffmpeg()
    passCheck('FfmpegValid', 'Ffmpeg is installed.')
  }
  catch (error) { failCheck('FfmpegValid', 'Ffmpeg path is not valid, try setting a custom one.') }

  ffmpeg.ffprobe('-version', (error) => {
    if (error) failCheck('FfprobeValid', 'Ffprobe path is not valid, try setting a custom one.')
    else passCheck('FfprobeValid', 'Ffprobe is installed.')
  })
}

export default ffmpeg