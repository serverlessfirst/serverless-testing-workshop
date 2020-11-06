import { User } from '@svc/lib/types/sports-club-manager';

export type ClaimsMap = { [name: string]: string | number | boolean | string[] };

export const getUserFromClaims = (claims: ClaimsMap) => ({
  id: claims.sub,
  name: claims.name,
  email: claims.email,
  username: claims['cognito:username'],
} as User);

export const getClaimsFromUser = (user: User) => {
  if (!user) {
    return {};
  }
  return {
    sub: user.id,
    name: user.name,
    'cognito:username': user.username,
    email: user.email,
  };
};
