import { useState, useEffect, useRef } from 'react';

type VideoStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

interface UseOptimizedVideoProps {
  src: string;
  autoLoad?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  poster?: string;
}

/**
 * Hook để tối ưu hóa việc tải và phát video
 * - Xử lý các trạng thái video
 * - Tự động dọn dẹp tài nguyên
 * - Cung cấp các hàm điều khiển video
 */
export function useOptimizedVideo({
  src,
  autoLoad = false,
  preload = 'metadata',
  poster,
}: UseOptimizedVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<VideoStatus>('loading');
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [buffered, setBuffered] = useState<number>(0);

  // Khởi tạo video element
  useEffect(() => {
    if (!videoRef.current) {
      const video = document.createElement('video');
      video.preload = preload;
      if (poster) video.poster = poster;
      
      // Xử lý các sự kiện
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('progress', handleProgress);
      video.addEventListener('playing', () => setStatus('playing'));
      video.addEventListener('pause', () => setStatus('paused'));
      video.addEventListener('ended', () => setStatus('ended'));
      video.addEventListener('error', () => setStatus('error'));
      
      videoRef.current = video;
    }
    
    return () => {
      if (videoRef.current) {
        // Cleanup khi component unmount
        const video = videoRef.current;
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('progress', handleProgress);
        video.removeEventListener('playing', () => setStatus('playing'));
        video.removeEventListener('pause', () => setStatus('paused'));
        video.removeEventListener('ended', () => setStatus('ended'));
        video.removeEventListener('error', () => setStatus('error'));
        
        // Dừng việc tải và phát
        video.pause();
        video.src = '';
        video.load();
      }
    };
  }, [preload, poster]);

  // Xử lý thay đổi src
  useEffect(() => {
    if (videoRef.current && src) {
      setStatus('loading');
      videoRef.current.src = src;
      
      if (autoLoad) {
        videoRef.current.load();
      }
    }
  }, [src, autoLoad]);

  // Xử lý các sự kiện
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleCanPlay = () => {
    setStatus('ready');
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      setProgress(time / (duration || 1) * 100);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered(bufferedEnd / (duration || 1) * 100);
    }
  };

  // Hàm điều khiển video
  const play = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
        setStatus('error');
      });
    }
  };

  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const seekPercent = (percent: number) => {
    if (videoRef.current) {
      const targetTime = (duration * percent) / 100;
      videoRef.current.currentTime = targetTime;
    }
  };

  return {
    videoElement: videoRef.current,
    status,
    progress,
    buffered,
    duration,
    currentTime,
    play,
    pause,
    seek,
    seekPercent,
    isLoading: status === 'loading',
    isReady: status === 'ready' || status === 'playing' || status === 'paused',
    isPlaying: status === 'playing',
    isPaused: status === 'paused',
    isEnded: status === 'ended',
    isError: status === 'error',
  };
}