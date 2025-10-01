const ANILIST_API_URL = 'https://graphql.anilist.co';

// GraphQL queries for AniList
const ANIME_QUERIES = {
  // Trending Anime
  TRENDING: `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, sort: TRENDING_DESC, status: RELEASING) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          bannerImage
          averageScore
          genres
          status
          episodes
          duration
          seasonYear
          season
          format
          description(asHtml: false)
          studios {
            nodes {
              name
            }
          }
          nextAiringEpisode {
            episode
            timeUntilAiring
          }
        }
      }
    }
  `,

  // Popular Anime
  POPULAR: `
    query ($page: Int, $perPage: Int, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, status_in: [FINISHED, RELEASING], seasonYear: $seasonYear) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          bannerImage
          averageScore
          genres
          status
          episodes
          duration
          seasonYear
          season
          format
          description(asHtml: false)
          studios {
            nodes {
              name
            }
          }
        }
      }
    }
  `,

  // Top Rated Anime
  TOP_RATED: `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC, status_in: [FINISHED, RELEASING]) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          bannerImage
          averageScore
          genres
          status
          episodes
          duration
          seasonYear
          season
          format
          description(asHtml: false)
          studios {
            nodes {
              name
            }
          }
        }
      }
    }
  `,

  // Upcoming Anime
  UPCOMING: `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, status: NOT_YET_RELEASED) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          bannerImage
          averageScore
          genres
          status
          episodes
          duration
          seasonYear
          season
          format
          description(asHtml: false)
          startDate {
            year
            month
            day
          }
          studios {
            nodes {
              name
            }
          }
        }
      }
    }
  `,

  // Anime by Genre
  BY_GENRE: `
    query ($page: Int, $perPage: Int, $genre: String) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, genre: $genre, status_in: [FINISHED, RELEASING]) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          bannerImage
          averageScore
          genres
          status
          episodes
          duration
          seasonYear
          season
          format
          description(asHtml: false)
          studios {
            nodes {
              name
            }
          }
        }
      }
    }
  `,

  // Anime Details
  DETAILS: `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        bannerImage
        averageScore
        meanScore
        genres
        status
        episodes
        duration
        seasonYear
        season
        format
        source
        description(asHtml: false)
        studios {
          nodes {
            name
          }
        }
        trailer {
          id
          site
        }
        relations {
          edges {
            node {
              id
              title {
                romaji
                english
              }
              coverImage {
                medium
              }
              type
              format
            }
            relationType
          }
        }
        recommendations {
          nodes {
            media {
              id
              title {
                romaji
                english
              }
              coverImage {
                medium
              }
              averageScore
              genres
            }
          }
        }
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        nextAiringEpisode {
          episode
          timeUntilAiring
        }
      }
    }
  `,

  // Search Anime
  SEARCH: `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          bannerImage
          averageScore
          genres
          status
          episodes
          duration
          seasonYear
          season
          format
          description(asHtml: false)
        }
      }
    }
  `,

  // Anime by Season
  SEASON: `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, season: $season, seasonYear: $seasonYear, status: RELEASING) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          bannerImage
          averageScore
          genres
          status
          episodes
          duration
          seasonYear
          season
          format
          description(asHtml: false)
          studios {
            nodes {
              name
            }
          }
        }
      }
    }
  `,
};

// Helper to get current season
const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'SPRING';
  if (month >= 6 && month <= 8) return 'SUMMER';
  if (month >= 9 && month <= 11) return 'FALL';
  return 'WINTER';
};

// AniList API functions
class AniListAPI {
  async makeRequest(query, variables = {}) {
    try {
      const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      return data.data;
    } catch (error) {
      console.error('AniList API Error:', error);
      throw error;
    }
  }

  // Get trending anime
  async getTrending(page = 1, perPage = 20) {
    return this.makeRequest(ANIME_QUERIES.TRENDING, { page, perPage });
  }

  // Get popular anime
  async getPopular(page = 1, perPage = 20) {
    return this.makeRequest(ANIME_QUERIES.POPULAR, { page, perPage });
  }

  // Get popular anime by year
  async getPopularByYear(seasonYear, page = 1, perPage = 20) {
    return this.makeRequest(ANIME_QUERIES.POPULAR, { page, perPage, seasonYear });
  }

  // Get top rated anime
  async getTopRated(page = 1, perPage = 20) {
    return this.makeRequest(ANIME_QUERIES.TOP_RATED, { page, perPage });
  }

  // Get upcoming anime
  async getUpcoming(page = 1, perPage = 20) {
    return this.makeRequest(ANIME_QUERIES.UPCOMING, { page, perPage });
  }

  // Get anime by season
  async getSeason(season, seasonYear, page = 1, perPage = 20) {
    return this.makeRequest(ANIME_QUERIES.SEASON, { page, perPage, season, seasonYear });
  }

  // Get this season's anime (NEW METHOD)
  async getThisSeason(page = 1, perPage = 20) {
    const season = getCurrentSeason();
    const year = new Date().getFullYear();
    return this.getSeason(season, year, page, perPage);
  }

  // Get anime by genre
  async getByGenre(genre, page = 1, perPage = 20) {
    return this.makeRequest(ANIME_QUERIES.BY_GENRE, { genre, page, perPage });
  }

  // Get anime details
  async getDetails(id) {
    return this.makeRequest(ANIME_QUERIES.DETAILS, { id });
  }

  // Search anime
  async search(searchTerm, page = 1, perPage = 20) {
    return this.makeRequest(ANIME_QUERIES.SEARCH, { search: searchTerm, page, perPage });
  }
}

// Anime genres for filtering
export const ANIME_GENRES = [
  { id: 'Action', name: 'Action', icon: '⚔️' },
  { id: 'Adventure', name: 'Adventure', icon: '🗺️' },
  { id: 'Comedy', name: 'Comedy', icon: '😂' },
  { id: 'Drama', name: 'Drama', icon: '🎭' },
  { id: 'Fantasy', name: 'Fantasy', icon: '🔮' },
  { id: 'Horror', name: 'Horror', icon: '👻' },
  { id: 'Romance', name: 'Romance', icon: '💕' },
  { id: 'Sci-Fi', name: 'Sci-Fi', icon: '🚀' },
  { id: 'Slice of Life', name: 'Slice of Life', icon: '🌸' },
  { id: 'Sports', name: 'Sports', icon: '⚽' },
  { id: 'Supernatural', name: 'Supernatural', icon: '✨' },
  { id: 'Thriller', name: 'Thriller', icon: '🔥' },
];

export const ANIME_CATEGORIES = [
  { id: 'trending', name: 'Trending', icon: '🔥' },
  { id: 'popular', name: 'Popular', icon: '⭐' },
  { id: 'top_rated', name: 'Top Rated', icon: '👑' },
  { id: 'upcoming', name: 'Upcoming', icon: '🚀' },
];

// Helper functions
export const getAnimeTitle = (anime) => {
  return anime.title?.english || anime.title?.romaji || anime.title?.native || 'Unknown';
};

export const getAnimeDescription = (anime) => {
  if (!anime.description) return 'No description available';
  return anime.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
};

export const formatAnimeScore = (score) => {
  return score ? (score / 10).toFixed(1) : '0.0';
};

export const formatAnimeStatus = (status) => {
  switch (status) {
    case 'RELEASING': return 'Airing';
    case 'FINISHED': return 'Completed';
    case 'NOT_YET_RELEASED': return 'Upcoming';
    case 'CANCELLED': return 'Cancelled';
    default: return status;
  }
};

export default new AniListAPI();
