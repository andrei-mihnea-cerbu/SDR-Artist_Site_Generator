export interface LatestYouTubeRelease {
  videoId: string;
  title: string;
  viewCount: number;
  publishedAt: string;
  thumbnailUrl: string;
}

export interface LatestSpotifyRelease {
  name: string;
  spotifyUrl: string;
  imageUrl: string | null;
}

export interface LatestReleases {
  youtube: LatestYouTubeRelease | null;
  spotify: LatestSpotifyRelease | null;
}
