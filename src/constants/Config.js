export const API_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  API_KEY: 'b5a681a2500178c77e610aaf5c2f8cbf', // Replace with your API key
  BACKDROP_SIZE: 'w1280',
  POSTER_SIZE: 'w500',
  PROFILE_SIZE: 'w185',
};

export const GENRES = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HISTORY: 36,
  HORROR: 27,
  MUSIC: 10402,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCIENCE_FICTION: 878,
  THRILLER: 53,
  WAR: 10752,
  WESTERN: 37,
};

export const CATEGORIES = [
  { id: 'trending', name: 'Trending', icon: '🔥' },
  { id: 'popular', name: 'Popular', icon: '⭐' },
  { id: 'top_rated', name: 'Top Rated', icon: '👑' },
  { id: 'upcoming', name: 'Upcoming', icon: '🚀' },
  { id: 'now_playing', name: 'Now Playing', icon: '🎬' },
];
