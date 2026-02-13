export interface Artist {
  id: string;
  name: string;
  type: string;
  website?: string;
  bio?: string;
  isActive: boolean;
  hasAvatar: boolean;
  hasLogo: boolean;
  hasFavicon: boolean;
}
