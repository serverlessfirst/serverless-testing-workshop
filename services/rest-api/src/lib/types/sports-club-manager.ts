
export enum ClubVisibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}

export interface Club {
  id: string;
  name: string;
  sport: string;
  visibility: ClubVisibility;
  profilePhotoUrlPath?: string;

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

export enum MemberRole {
  MANAGER = 'MANAGER',
  PLAYER = 'PLAYER',
  STAFF = 'STAFF',
}

export interface ClubMember {
  role: MemberRole;
  user: User;
  club: Club;
}

export interface ScheduledGame {
  startTime: string;
  venue?: string;
  details?: string;
  clubId: string;
  opponent: string;
}

// ==== EventBridge event message schemas

export enum EventDetailType {
  MEMBER_JOINED_CLUB = 'MEMBER_JOINED_CLUB',
  NEW_SCHEDULED_GAME = 'NEW_SCHEDULED_GAME',
}

export interface MemberJoinedClubEvent {
  member: ClubMember;
}

export interface NewScheduledGameEvent {
  game: ScheduledGame;
}

export type PublishableEventDetail = MemberJoinedClubEvent | NewScheduledGameEvent;
