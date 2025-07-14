import { Express, Request, Response } from 'express';
import { getActorImagesForMovie, getMovieWithActorImages } from '../services/tmdb.js';
import { cachedGet, CacheType } from '../cache.js';

export function setupActorRoutes(app: Express) {
  // API lấy ảnh diễn viên cho một phim cụ thể
  app.get('/api/movies/:slug/actors', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        return res.status(400).json({ 
          error: 'Movie slug is required' 
        });
      }
      
      // Lấy thông tin phim từ phimapi
      const movieResponse = await cachedGet(`https://phimapi.com/phim/${slug}`, {}, false, CacheType.DETAIL);
      
      if (!movieResponse.data || !movieResponse.data.movie) {
        return res.status(404).json({ 
          error: 'Movie not found' 
        });
      }
      
      const movie = movieResponse.data.movie;
      
      // Lấy thông tin diễn viên kèm ảnh
      if (!movie.actor || !Array.isArray(movie.actor) || movie.actor.length === 0) {
        return res.json({
          success: true,
          actors: [],
          message: 'No actors found for this movie'
        });
      }
      
      const year = movie.year || movie.release_date?.split('-')[0];
      const actorImages = await getActorImagesForMovie(movie.name, movie.actor, year);
      
      res.json({
        success: true,
        actors: actorImages,
        movieInfo: {
          title: movie.name,
          year: year,
          slug: slug
        }
      });
      
    } catch (error) {
      console.error('Error fetching actor images:', error);
      res.status(500).json({ 
        error: 'Internal server error while fetching actor images' 
      });
    }
  });
  
  // API lấy thông tin phim với ảnh diễn viên tích hợp
  app.get('/api/movies/:slug/details-with-actors', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        return res.status(400).json({ 
          error: 'Movie slug is required' 
        });
      }
      
      // Lấy thông tin phim từ phimapi
      const movieResponse = await cachedGet(`https://phimapi.com/phim/${slug}`, {}, false, CacheType.DETAIL);
      
      if (!movieResponse.data || !movieResponse.data.movie) {
        return res.status(404).json({ 
          error: 'Movie not found' 
        });
      }
      
      const movie = movieResponse.data.movie;
      
      // Xử lý URL ảnh
      const baseCdnUrl = "https://phimimg.com/";
      if (movie.poster_url && 
          !movie.poster_url.startsWith("http") && 
          !movie.poster_url.startsWith("https")) {
        movie.poster_url = baseCdnUrl + movie.poster_url;
      }
      
      if (movie.thumb_url && 
          !movie.thumb_url.startsWith("http") && 
          !movie.thumb_url.startsWith("https")) {
        movie.thumb_url = baseCdnUrl + movie.thumb_url;
      }
      
      // Lấy thông tin diễn viên kèm ảnh
      const movieWithActors = await getMovieWithActorImages(movie);
      
      res.json({
        status: true,
        movie: movieWithActors,
        episodes: movieResponse.data.episodes || []
      });
      
    } catch (error) {
      console.error('Error fetching movie details with actors:', error);
      res.status(500).json({ 
        error: 'Internal server error while fetching movie details' 
      });
    }
  });
}
