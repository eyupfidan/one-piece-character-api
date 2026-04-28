export interface Character {
  letter: string;
  name: string;
  chapter: string;
  episode: string;
  year: string;
  note: string;
}

export interface Crew {
  letter: string;
  name: string;
  numberOfMembers: string;
  chapter: string;
  episode: string;
  year: string;
  note: string;
}

export interface CharacterDetail {
  name: string;
  status?: string;
  age?: string;
  birthday?: string;
  height?: string;
  affiliations?: string;
  occupations?: string;
  [key: string]: unknown;
}

export interface CachePayload {
  generatedAt?: string;
  characters?: Character[];
  crews?: Crew[];
  details?: CharacterDetail[];
}
