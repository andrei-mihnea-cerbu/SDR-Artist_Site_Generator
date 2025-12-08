export interface Social {
  id: string;
  name: string;
  description: string;
  url: string;
  originalUrl: string;
  socialLabelsList: string[];
}

export interface SocialLabel {
  id: string;
  name: string;
  description: string;
}
