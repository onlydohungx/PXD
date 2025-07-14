import { apiRequest } from './queryClient';

export interface MovieRecommendation {
  basedOnCategories: string[];
  basedOnCountries: string[];
  confidenceScore: number;
  movies: any[]; // Dữ liệu phim từ API
}

/**
 * Lấy các đề xuất phim dựa trên thói quen xem của người dùng
 */
export const getRecommendations = async (): Promise<MovieRecommendation> => {
  try {
    const response = await apiRequest('GET', '/api/user/recommendations');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

export interface UserPreferences {
  categories: {category: string, count: number}[];
  countries: {country: string, count: number}[];
}

export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const response = await apiRequest('GET', '/api/user/preferences');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
};

export const recordMovieView = async (
  movieSlug: string,
  categories: string[],
  country?: string
): Promise<void> => {
  try {
    await apiRequest('POST', `/api/user/watch-history/${movieSlug}/analyze`, {
      categories,
      country
    });
  } catch (error) {
    console.error('Error recording movie view:', error);
  }
};

export const generateNewRecommendations = async (): Promise<MovieRecommendation> => {
  try {
    const response = await apiRequest('POST', '/api/user/recommendations/generate');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating new recommendations:', error);
    throw error;
  }
};

export const markRecommendationsAsViewed = async (): Promise<void> => {
  try {
    await apiRequest('POST', '/api/user/recommendations/viewed');
  } catch (error) {
    console.error('Error marking recommendations as viewed:', error);
    throw error;
  }
};