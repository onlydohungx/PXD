import { Express, Request, Response } from 'express';
import axios from 'axios';

/**
 * Chuyển đổi URL tương đối thành URL tuyệt đối
 */
function resolveUrl(baseUrl: string, relativeUrl: string): string {
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  
  const base = new URL(baseUrl);
  return new URL(relativeUrl, base).toString();
}

/**
 * Kiểm tra xem có phải master playlist không
 */
function isMasterPlaylist(content: string): boolean {
  return content.includes('#EXT-X-STREAM-INF');
}

/**
 * Xử lý master playlist - chuyển đổi URL của sub-playlist
 */
function processMasterPlaylist(content: string, originalUrl: string): string {
  const lines = content.split('\n');
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      processedLines.push(line);
      continue;
    }

    // Nếu là dòng chứa thông tin stream
    if (line.startsWith('#EXT-X-STREAM-INF')) {
      processedLines.push(line);
      
      // Dòng tiếp theo sẽ là URL của sub-playlist
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.startsWith('#')) {
          // Chuyển đổi thành URL tuyệt đối và đưa qua API filter
          const absoluteUrl = resolveUrl(originalUrl, nextLine);
          const filteredUrl = `/api/video/m3u8-filter?url=${encodeURIComponent(absoluteUrl)}`;
          processedLines.push(filteredUrl);
          i++; // Bỏ qua dòng tiếp theo vì đã xử lý
          continue;
        }
      }
    } else {
      processedLines.push(line);
    }
  }

  return processedLines.join('\n');
}

/**
 * Lọc quảng cáo từ nội dung M3U8
 * @param m3u8Content Nội dung file M3U8 gốc
 * @param baseUrl URL gốc để resolve các URL tương đối
 * @returns Nội dung M3U8 đã được lọc quảng cáo
 */
function filterAdsFromM3U8(m3u8Content: string, baseUrl: string): string {
  const lines = m3u8Content.split('\n');
  const filteredLines: string[] = [];
  let skipUntilDiscontinuity = false;
  let lastLineWasDiscontinuity = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Bỏ qua dòng trống
    if (!line) {
      filteredLines.push(line);
      continue;
    }

    // Kiểm tra tag KEY với METHOD=NONE - bắt đầu block quảng cáo
    if (line.includes('#EXT-X-KEY:METHOD=NONE')) {
      skipUntilDiscontinuity = true;
      continue;
    }

    // Nếu đang trong block quảng cáo, bỏ qua cho đến khi gặp DISCONTINUITY
    if (skipUntilDiscontinuity) {
      if (line.includes('#EXT-X-DISCONTINUITY')) {
        skipUntilDiscontinuity = false;
        lastLineWasDiscontinuity = true;
      }
      continue;
    }

    // Kiểm tra các segment quảng cáo dựa trên đường dẫn
    if (line.includes('/v7/') || 
        line.includes('segment_') || 
        line.includes('convertv7/')) {
      // Bỏ qua segment quảng cáo và thông tin liên quan
      // Cũng bỏ qua dòng trước đó nếu là thông tin về segment (như #EXTINF)
      if (filteredLines.length > 0 && filteredLines[filteredLines.length - 1].startsWith('#EXTINF')) {
        filteredLines.pop();
      }
      continue;
    }

    // Xử lý URL tương đối trong segment
    if (!line.startsWith('#') && line.length > 0) {
      // Chuyển đổi URL tương đối thành tuyệt đối
      const absoluteUrl = resolveUrl(baseUrl, line);
      filteredLines.push(absoluteUrl);
      continue;
    }

    // Xử lý DISCONTINUITY - loại bỏ những cái thừa
    if (line.includes('#EXT-X-DISCONTINUITY')) {
      // Nếu dòng trước đó cũng là DISCONTINUITY thì bỏ qua
      if (lastLineWasDiscontinuity) {
        continue;
      }
      lastLineWasDiscontinuity = true;
    } else {
      lastLineWasDiscontinuity = false;
    }

    filteredLines.push(line);
  }

  return filteredLines.join('\n');
}

/**
 * Lấy và xử lý M3U8 từ URL gốc
 */
export function setupVideoRoutes(app: Express) {
  // API để lấy M3U8 đã lọc quảng cáo
  app.get('/api/video/m3u8-filter', async (req: Request, res: Response) => {
    try {
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          status: false,
          message: 'URL M3U8 là bắt buộc'
        });
      }

      console.log(`Đang lấy và lọc M3U8 từ: ${url}`);

      // Lấy nội dung M3U8 gốc
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://phimapi.com/',
          'Accept': '*/*'
        }
      });

      const originalContent = response.data;
      
      // Kiểm tra xem có phải file M3U8 hợp lệ không
      if (!originalContent.includes('#EXTM3U')) {
        return res.status(400).json({
          status: false,
          message: 'URL không trả về file M3U8 hợp lệ'
        });
      }

      let filteredContent: string;

      // Kiểm tra xem có phải master playlist không
      if (isMasterPlaylist(originalContent)) {
        console.log('Đây là master playlist, đang xử lý các sub-playlist...');
        filteredContent = processMasterPlaylist(originalContent, url);
      } else {
        console.log('Đây là sub-playlist, đang lọc quảng cáo...');
        filteredContent = filterAdsFromM3U8(originalContent, url);
      }
      
      console.log(`Đã xử lý thành công M3U8. Kích thước gốc: ${originalContent.length}, sau xử lý: ${filteredContent.length}`);

      // Trả về nội dung đã lọc với header phù hợp
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      
      res.send(filteredContent);

    } catch (error: any) {
      console.error('Lỗi khi xử lý M3U8:', error);
      
      res.status(500).json({
        status: false,
        message: 'Không thể xử lý file M3U8',
        error: error.message
      });
    }
  });

  // API để kiểm tra URL M3U8 có hợp lệ không
  app.get('/api/video/check-m3u8', async (req: Request, res: Response) => {
    try {
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          status: false,
          message: 'URL là bắt buộc'
        });
      }

      const response = await axios.head(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const isValid = response.status === 200;
      const contentType = response.headers['content-type'] || '';

      res.json({
        status: true,
        isValid,
        contentType,
        accessible: isValid
      });

    } catch (error: any) {
      res.json({
        status: true,
        isValid: false,
        accessible: false,
        error: error.message
      });
    }
  });
}
