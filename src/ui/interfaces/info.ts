import { Artist } from './artist';
import { Description } from './description';
import { Social } from './social';
import { LatestReleases } from './latest-releases';

export interface InfoResponse {
  artist: Artist;
  description: Description;
  socials: Social[];
  latestReleases: LatestReleases;
}
