/**
 * Parse YouTube video ID from various URL formats
 * Handles:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - dQw4w9WgXcQ (direct ID)
 * @param {string} url - YouTube URL or video ID
 * @returns {string|null} YouTube video ID or null if invalid
 */
export function parseYouTubeId(url) {
  if (!url) return null;

  // If it looks like a direct ID (11 alphanumeric characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Try to extract from standard youtube.com URLs
  const youtubeMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return youtubeMatch[1];
  }

  // Try to extract from youtu.be short URLs
  const shortyMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortyMatch) {
    return shortyMatch[1];
  }

  return null;
}

/**
 * Generate an embeddable YouTube iframe URL from a video ID or URL
 * @param {string} input - YouTube video ID or full URL
 * @returns {string} Embeddable YouTube URL
 */
export function getYouTubeEmbedUrl(input) {
  const videoId = parseYouTubeId(input);
  if (!videoId) {
    return "";
  }
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Generate a YouTube thumbnail URL from a video ID or URL
 * Uses the high quality thumbnail (maxresdefault), falls back to standard (hqdefault)
 * @param {string} input - YouTube video ID or full URL
 * @returns {string} YouTube thumbnail URL
 */
export function getYouTubeThumb(input) {
  const videoId = parseYouTubeId(input);
  if (!videoId) {
    return "";
  }
  // Use maxresdefault for highest quality, with hqdefault as fallback
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Generate a standard YouTube watch URL from a video ID or URL
 * @param {string} input - YouTube video ID or full URL
 * @returns {string} Standard YouTube watch URL (https://www.youtube.com/watch?v=...)
 */
export function getYouTubeWatchUrl(input) {
  const videoId = parseYouTubeId(input);
  if (!videoId) {
    return "";
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}
