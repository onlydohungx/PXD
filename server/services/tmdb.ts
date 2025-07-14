import axios from 'axios';
import { cachedGet, CacheType } from '../cache.js';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w185'; // w185 for actor profile images

export interface TMDBMovieResult {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  popularity: number;
}

export interface TMDBActorResult {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  popularity: number;
  known_for_department: string;
}

export interface TMDBPersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
  known_for_department: string;
}

/**
 * Tìm kiếm phim trên TMDB theo tên
 */
export async function searchMovieOnTMDB(movieTitle: string, year?: string): Promise<TMDBMovieResult | null> {
  try {
    if (!TMDB_API_KEY) {
      console.error('TMDB API key not configured');
      return null;
    }

    const searchQuery = encodeURIComponent(movieTitle);
    const yearParam = year ? `&year=${year}` : '';
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}&language=vi-VN${yearParam}`;
    
    const response = await cachedGet(url, {}, false, CacheType.SEARCH);
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      return response.data.results[0]; // Lấy kết quả đầu tiên
    }
    
    return null;
  } catch (error) {
    console.error('Error searching movie on TMDB:', error);
    return null;
  }
}

/**
 * Lấy thông tin diễn viên của phim từ TMDB
 */
export async function getMovieCredits(tmdbMovieId: number): Promise<TMDBActorResult[]> {
  try {
    if (!TMDB_API_KEY) {
      console.error('TMDB API key not configured');
      return [];
    }

    const url = `${TMDB_BASE_URL}/movie/${tmdbMovieId}/credits?api_key=${TMDB_API_KEY}&language=vi-VN`;
    
    const response = await cachedGet(url, {}, false, CacheType.DETAIL);
    
    if (response.data && response.data.cast) {
      return response.data.cast
        .filter((actor: TMDBActorResult) => actor.profile_path) // Chỉ lấy diễn viên có ảnh
        .slice(0, 12); // Giới hạn 12 diễn viên
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching movie credits from TMDB:', error);
    return [];
  }
}

/**
 * Tìm kiếm diễn viên trên TMDB theo tên
 */
export async function searchActorOnTMDB(actorName: string): Promise<TMDBPersonResult | null> {
  try {
    if (!TMDB_API_KEY) {
      console.error('TMDB API key not configured');
      return null;
    }

    const searchQuery = encodeURIComponent(actorName);
    const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${searchQuery}&language=vi-VN`;
    
    const response = await cachedGet(url, {}, false, CacheType.SEARCH);
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      // Tìm diễn viên có ảnh và phù hợp nhất
      const actorWithImage = response.data.results.find((person: TMDBPersonResult) => 
        person.profile_path && person.known_for_department === 'Acting'
      );
      
      return actorWithImage || response.data.results[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error searching actor on TMDB:', error);
    return null;
  }
}

/**
 * Lấy URL ảnh đầy đủ cho diễn viên
 */
export function getActorImageUrl(profilePath: string | null): string | null {
  if (!profilePath) return null;
  return `${TMDB_IMAGE_BASE_URL}${profilePath}`;
}

/**
 * Lấy thông tin diễn viên kèm ảnh cho một phim
 */
export async function getActorImagesForMovie(movieTitle: string, actorNames: string[], year?: string): Promise<Array<{
  name: string;
  imageUrl: string | null;
  tmdbId?: number;
}>> {
  try {
    // Tìm phim trên TMDB trước
    const tmdbMovie = await searchMovieOnTMDB(movieTitle, year);
    
    if (tmdbMovie) {
      // Lấy thông tin diễn viên từ TMDB credits
      const credits = await getMovieCredits(tmdbMovie.id);
      
      // Ghép nối thông tin diễn viên từ phimapi và TMDB
      const actorImages = await Promise.all(
        actorNames.map(async (actorName) => {
          // Tìm diễn viên trong credits của phim
          const creditActor = credits.find(actor => 
            actor.name.toLowerCase().includes(actorName.toLowerCase()) ||
            actorName.toLowerCase().includes(actor.name.toLowerCase())
          );
          
          if (creditActor && creditActor.profile_path) {
            return {
              name: actorName,
              imageUrl: getActorImageUrl(creditActor.profile_path),
              tmdbId: creditActor.id
            };
          }
          
          // Nếu không tìm thấy trong credits, tìm kiếm riêng lẻ
          const searchResult = await searchActorOnTMDB(actorName);
          
          return {
            name: actorName,
            imageUrl: searchResult ? getActorImageUrl(searchResult.profile_path) : null,
            tmdbId: searchResult?.id
          };
        })
      );
      
      return actorImages;
    }
    
    // Nếu không tìm thấy phim, tìm kiếm từng diễn viên
    const actorImages = await Promise.all(
      actorNames.map(async (actorName) => {
        const searchResult = await searchActorOnTMDB(actorName);
        
        return {
          name: actorName,
          imageUrl: searchResult ? getActorImageUrl(searchResult.profile_path) : null,
          tmdbId: searchResult?.id
        };
      })
    );
    
    return actorImages;
  } catch (error) {
    console.error('Error getting actor images for movie:', error);
    return actorNames.map(name => ({
      name,
      imageUrl: null
    }));
  }
}

/**
 * Lấy thông tin phim và diễn viên kèm ảnh
 */
export async function getMovieWithActorImages(movieData: any): Promise<any> {
  try {
    if (!movieData.actor || !Array.isArray(movieData.actor) || movieData.actor.length === 0) {
      return movieData;
    }
    
    const year = movieData.year || movieData.release_date?.split('-')[0];
    const actorImages = await getActorImagesForMovie(movieData.name, movieData.actor, year);
    
    return {
      ...movieData,
      actorImages
    };
  } catch (error) {
    console.error('Error getting movie with actor images:', error);
    return movieData;
  }
}
