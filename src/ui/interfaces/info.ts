import { Artist } from './artist';
import { Social } from './social';
import { LatestReleases } from './latest-releases';

export interface InfoResponse {
  artist: Artist;
  socials: Social[];
  latestReleases: LatestReleases;
}
