/**
 * Tạo URL đã lọc quảng cáo cho M3U8 stream
 * @param originalUrl URL M3U8 gốc từ API
 * @returns URL đã được xử lý qua hệ thống lọc quảng cáo
 */
export function getFilteredM3U8Url(originalUrl: string): string {
  if (!originalUrl) return '';
  
  // Kiểm tra xem có phải là URL M3U8 không
  if (!originalUrl.includes('.m3u8')) {
    return originalUrl;
  }
  
  // Tạo URL qua API lọc quảng cáo
  const encodedUrl = encodeURIComponent(originalUrl);
  return `/api/video/m3u8-filter?url=${encodedUrl}`;
}

/**
 * Kiểm tra URL có phải là M3U8 stream không
 * @param url URL cần kiểm tra
 * @returns true nếu là M3U8 stream
 */
export function isM3U8Stream(url: string): boolean {
  return url.includes('.m3u8') || url.includes('m3u8');
}

/**
 * Lấy thông tin chất lượng video từ M3U8 master playlist
 * @param url URL M3U8 master playlist
 * @returns Promise với danh sách chất lượng video
 */
export async function getVideoQualityOptions(url: string): Promise<Array<{label: string, src: string}>> {
  try {
    const response = await fetch(url);
    const m3u8Content = await response.text();
    
    const qualityOptions: Array<{label: string, src: string}> = [];
    const lines = m3u8Content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Tìm các dòng chứa thông tin chất lượng
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);
        const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
        
        if (resolutionMatch && i + 1 < lines.length) {
          const streamUrl = lines[i + 1].trim();
          const resolution = resolutionMatch[1];
          const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0;
          
          // Tạo label dựa trên resolution
          let label = resolution;
          if (resolution.includes('1920x1080')) label = '1080p';
          else if (resolution.includes('1280x720')) label = '720p';
          else if (resolution.includes('854x480')) label = '480p';
          else if (resolution.includes('640x360')) label = '360p';
          
          qualityOptions.push({
            label: `${label} (${Math.round(bandwidth / 1000)}kbps)`,
            src: getFilteredM3U8Url(streamUrl)
          });
        }
      }
    }
    
    // Sắp xếp theo chất lượng từ cao xuống thấp
    qualityOptions.sort((a, b) => {
      const aHeight = parseInt(a.label.match(/(\d+)p/)?.[1] || '0');
      const bHeight = parseInt(b.label.match(/(\d+)p/)?.[1] || '0');
      return bHeight - aHeight;
    });
    
    return qualityOptions;
  } catch (error) {
    console.error('Error parsing M3U8 quality options:', error);
    return [];
  }
}

/**
 * Xử lý URL video trước khi phát
 * @param url URL gốc từ API
 * @returns URL đã được xử lý
 */
export function processVideoUrl(url: string): string {
  if (!url) return '';
  
  // Nếu là M3U8 stream, áp dụng bộ lọc quảng cáo
  if (isM3U8Stream(url)) {
    return getFilteredM3U8Url(url);
  }
  
  // Trả về URL gốc cho các định dạng khác
  return url;
}
