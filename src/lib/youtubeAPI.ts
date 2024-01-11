import YoutubeAPI from 'simple-youtube-api'
import EnvVariables from '#src/EnvVariables'
import { passCheck, failCheck } from '#src/lib/requirements'

const youtubeAPI = new YoutubeAPI(EnvVariables.YOUTUBE_API_KEY)

// Check if the YouTube API key is valid by searching for a video
export async function checkYouTubeAPIKey() {
  try {
    await youtubeAPI.searchVideos('test')
    passCheck('YouTubeAPIKeyValid', 'YouTube API key is valid.')
  }
  catch (error) { failCheck('YouTubeAPIKeyValid', 'YouTube API key is invalid, verify you set a correct one.') }
}

export default youtubeAPI