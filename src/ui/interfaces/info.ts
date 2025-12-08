import { Artist } from './artist';
import { Description } from './description';
import { Social } from './social';

export interface InfoResponse {
  artist: Artist;
  description: Description;
  socials: Social[];
}
