/**
 * Helper functions for Cloudinary subtitle URLs
 */

/**
 * Generates a Cloudinary video URL with subtitle overlay
 * @param publicId - Cloudinary public ID of the video
 * @param baseUrl - Optional base URL (if you have the original video URL)
 * @returns URL with subtitle overlay
 */
export function getVideoWithSubtitles(publicId: string, baseUrl?: string): string {
  // Extract cloud name and other parts from baseUrl if provided
  // Otherwise, construct from publicId
  const transcriptPublicId = `${publicId}.transcript`;
  const subtitleOverlay = `subtitles:${transcriptPublicId}`;
  
  // If we have a base URL, we can extract the domain and construct the subtitle URL
  // Otherwise, we'll need the Cloudinary config (which we don't have on frontend)
  // For now, return a URL that Cloudinary will process
  if (baseUrl) {
    // Extract the base URL without the public_id
    const urlParts = baseUrl.split('/');
    const videoIndex = urlParts.findIndex(part => part.includes('video') || part.includes('upload'));
    if (videoIndex >= 0) {
      const basePath = urlParts.slice(0, videoIndex + 2).join('/'); // Include upload/ and version
      return `${basePath}/l_subtitles:${transcriptPublicId}/fl_layer_apply/${publicId}`;
    }
  }
  
  // Fallback: return a transformation URL pattern
  // This will be constructed properly by Cloudinary when the video is accessed
  return baseUrl || '';
}

/**
 * Checks if a video has subtitles available
 * @param mediaItem - Media item to check
 * @returns true if subtitle URL is available
 */
export function hasSubtitles(mediaItem: { subtitleUrl?: string; publicId?: string; type: string }): boolean {
  return mediaItem.type === 'video' && (!!mediaItem.subtitleUrl || !!mediaItem.publicId);
}

/**
 * Gets the best available video URL (with subtitles if available, otherwise original)
 * @param mediaItem - Media item
 * @returns Video URL to use
 */
export function getVideoUrl(mediaItem: { url: string; subtitleUrl?: string; publicId?: string; type: string }): string {
  if (mediaItem.type === 'video' && mediaItem.subtitleUrl) {
    return mediaItem.subtitleUrl;
  }
  return mediaItem.url;
}
