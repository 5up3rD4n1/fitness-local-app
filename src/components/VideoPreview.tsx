import React, { useState } from 'react';

interface VideoPreviewProps {
  videoUrl: string;
  title?: string;
  className?: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoUrl, title, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = getYouTubeVideoId(videoUrl);

  if (!videoId) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl p-8 ${className}`}
        style={{
          background: 'var(--color-secondary-bg)',
          border: '1px solid var(--color-border-primary)',
        }}
      >
        <div className="text-center text-text-secondary">
          <svg className="h-12 w-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V3.5C15 2.7 14.3 2 13.5 2H10.5C9.7 2 9 2.7 9 3.5V5.5L3 7V9H21ZM6 12V20C6 20.6 6.4 21 7 21H9V19H15V21H17C17.6 21 18 20.6 18 20V12L12 10L6 12Z" />
          </svg>
          <p className="text-caption">No hay video disponible</p>
        </div>
      </div>
    );
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  if (showVideo) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
          <iframe
            src={embedUrl}
            title={title || 'Exercise Video'}
            className="h-full w-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoaded(true)}
          />
          {!isLoaded && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'var(--color-secondary-bg)' }}
            >
              <div className="spinner h-8 w-8"></div>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowVideo(false)}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-scrim text-white transition-colors hover:bg-black/90"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative group cursor-pointer ${className}`}>
      <div
        className="relative aspect-video w-full overflow-hidden rounded-2xl"
        style={{ background: 'var(--color-surface-raised)' }}
      >
        <img
          src={thumbnailUrl}
          alt={title || 'Exercise Video Thumbnail'}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />

        {/* Play button */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/60"
          onClick={() => setShowVideo(true)}
        >
          <div
            className="flex h-[58px] w-[58px] items-center justify-center rounded-full transition-transform group-hover:scale-110"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              boxShadow: '0 10px 30px -8px rgba(0, 0, 0, 0.6)',
            }}
          >
            <svg
              className="ml-[3px] h-[22px] w-[22px] text-youtube"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* "Ver demostración" label */}
        <div className="absolute bottom-[10px] left-3 z-[1]">
          <span
            className="font-display text-[11px] font-semibold tracking-[0.06em]"
            style={{ color: '#cdd7e6' }}
          >
            Ver demostración
          </span>
        </div>

        {/* Loading indicator */}
        {!isLoaded && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'var(--color-secondary-bg)' }}
          >
            <div className="spinner h-8 w-8"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreview;
