
export enum ClubVisibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}

export interface Club {
  id: string;
  name: string;
  sport: string;
  visibility: ClubVisibility;

  /** ID of the user who created the club */
  managerId: string;
}

export interface UserProfile {
  username: string;
  email: string;
  name?: string;
}

export interface User extends UserProfile {
  id: string;
}

export interface PagedList<T> {
  items: T[];
  lastEvaluatedKey?: string;
}

export interface PagedQueryOptions {
  limit?: number;
  lastEvaluatedKey?: string;
}
