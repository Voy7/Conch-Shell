import prism from 'prism-media'

// Get the Ffmpeg binary path
const FfmpegPath = prism.FFmpeg.getInfo().command
console.log('prism Ffmpeg:', FfmpegPath)