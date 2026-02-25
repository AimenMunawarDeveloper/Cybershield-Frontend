"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MediaItem } from '@/lib/coursesData';

// Dynamically import react-player to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-500">Loading video player...</div>
    </div>
  )
});

interface VideoPlayerProps {
  mediaItem: MediaItem;
  className?: string;
}

/**
 * VideoPlayer component that handles both YouTube videos and legacy Cloudinary videos
 * - YouTube videos: Uses react-player which automatically handles YouTube's auto-subtitles
 * - Legacy Cloudinary videos: Uses native HTML5 video tag with subtitle tracks
 */
export default function VideoPlayer({ mediaItem, className = '' }: VideoPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if this is a YouTube video
  const isYouTubeVideo = mediaItem.youtubeId || 
    (mediaItem.url && (
      mediaItem.url.includes('youtube.com/embed/') || 
      mediaItem.url.includes('youtube.com/watch?v=') ||
      mediaItem.url.includes('youtu.be/')
    ));

  if (isYouTubeVideo) {
    // Extract YouTube video ID from URL or use the stored youtubeId
    let videoId = '';
    
    if (mediaItem.youtubeId) {
      videoId = mediaItem.youtubeId;
    } else if (mediaItem.url && mediaItem.url.includes('youtube.com/embed/')) {
      // Extract ID from embed URL: https://www.youtube.com/embed/VIDEO_ID
      const match = mediaItem.url.match(/embed\/([^/?]+)/);
      if (match) {
        videoId = match[1];
      }
    } else if (mediaItem.url && mediaItem.url.includes('youtube.com/watch?v=')) {
      // Extract from watch URL
      const match = mediaItem.url.match(/[?&]v=([^&]+)/);
      if (match) {
        videoId = match[1];
      }
    } else if (mediaItem.url && mediaItem.url.includes('youtu.be/')) {
      // Extract from short URL
      const match = mediaItem.url.match(/youtu.be\/([^/?]+)/);
      if (match) {
        videoId = match[1];
      }
    }

    // Build embed URL with subtitle support
    // Using iframe directly is more reliable than react-player for YouTube
    const embedUrl = videoId 
      ? `https://www.youtube.com/embed/${videoId}?cc_load_policy=1&rel=0&modestbranding=1`
      : mediaItem.url && mediaItem.url.includes('embed/') 
        ? mediaItem.url + (mediaItem.url.includes('?') ? '&' : '?') + 'cc_load_policy=1&rel=0&modestbranding=1'
        : '';

    if (!embedUrl) {
      console.error('VideoPlayer: Could not extract YouTube video ID from:', mediaItem);
      return (
        <div className={`relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-100 ${className} flex items-center justify-center`}>
          <div className="text-red-500">Invalid YouTube URL</div>
        </div>
      );
    }

    console.log('VideoPlayer - Using YouTube iframe:', { videoId, embedUrl });

    // Use YouTube iframe directly - it's more reliable and supports subtitles automatically
    // YouTube's iframe player automatically shows available captions
    return (
      <div className={`relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-100 ${className}`}>
        <iframe
          src={embedUrl}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
          onLoad={() => {
            console.log('YouTube iframe loaded successfully');
          }}
        />
      </div>
    );
  }

  // Legacy Cloudinary video - use native HTML5 video tag
  return (
    <div className={`relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-100 ${className}`}>
      <video
        src={mediaItem.url}
        controls
        className="w-full h-full object-contain"
        onError={(e) => {
          console.error('Video failed to load:', mediaItem.url);
          e.currentTarget.style.display = 'none';
        }}
      >
        {mediaItem.publicId && (
          <track
            kind="subtitles"
            srcLang="en"
            label="English"
            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/upload/subtitles/${encodeURIComponent(mediaItem.publicId)}`}
            default
            onError={(e) => {
              // Subtitles not available yet - silently fail
              console.log('Subtitles not available yet for video:', mediaItem.publicId);
            }}
          />
        )}
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
