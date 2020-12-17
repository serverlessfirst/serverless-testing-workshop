import { User } from '@svc/lib/types/sports-club-manager';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { generateTestUser, randomPassword } from './test-data-generator';

/* eslint no-console: 0 */

export interface TestUserManagerConfig {
  usernamePrefix: string;
  cognitoUserPoolId: string;
  cognitoUserPoolClientId: string;
  region: string;
}

export interface AuthenticatedUser {
  user: User;
  idToken: string;
}

interface CreatedUserContext {
  user: User;
  inCognito: boolean;
}

/**
 * Helper class for managing the creation and deletion of users in Cognito during test runs.
 */
export class TestUserManager {
  private readonly createdUsers: CreatedUserContext[] = [];

  private readonly cognitoIsp: CognitoIdentityProvider;

  constructor(private readonly config: TestUserManagerConfig) {
    this.cognitoIsp = new CognitoIdentityProvider({ region: config.region });
  }

  async createUser(password: string) {
    const userProfile = generateTestUser(this.config.usernamePrefix);
    const username = userProfile.email;
    const result = await this.cognitoIsp.adminCreateUser({
      UserPoolId: this.config.cognitoUserPoolId,
      Username: username,
      MessageAction: 'SUPPRESS', // ensure that no emails are sent out to test users
      TemporaryPassword: password,
      UserAttributes: [
        { Name: 'name', Value: userProfile.name },
        { Name: 'email', Value: userProfile.email },
      ],
    });
    const user: User = {
      ...userProfile,
      id: result.User?.Attributes?.find(a => a.Name === 'sub')?.Value!,
    };
    this.createdUsers.push({ user, inCognito: true });
    return user;
  }

  async createAndSignInUser() {
    const password = randomPassword();
    const testUser = await this.createUser(password);
    return this.signInUser(testUser, password);
  }

  async createAndSignInUsers(n: number) {
    return Promise.all(_.times(n, async () => this.createAndSignInUser()));
  }

  /**
   * Generates a user object without saving to Cognito.
   */
  createInMemoryUser(userId?: string) {
    const user: User = {
      id: userId || uuidv4(),
      ...generateTestUser(this.config.usernamePrefix),
    };
    this.createdUsers.push({ user, inCognito: false });
    return user;
  }

  async signInUser(user: User, password: string) {
    try {
      const signinResult = await this.cognitoIsp.initiateAuth({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.config.cognitoUserPoolClientId,
        AuthParameters: {
          USERNAME: user.username,
          PASSWORD: password,
        },
      });

      // Now need to ensure that new password is set in order that user status is set to CONFIRMED.
      // Since this is only a test user, we'll just keep the same password.
      const challengeResp = await this.cognitoIsp.respondToAuthChallenge({
        ClientId: this.config.cognitoUserPoolClientId,
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: signinResult.Session,
        ChallengeResponses: {
          USERNAME: user.username,
          NEW_PASSWORD: password,
        },
      });
      if (!challengeResp.AuthenticationResult) {
        return Promise.reject(new Error('Authentication failed'));
      }
      return {
        user,
        idToken: challengeResp.AuthenticationResult.IdToken!,
      } as AuthenticatedUser;
    } catch (error) {
      console.error('Error signing in Cognito user', error);
      throw error;
    }
  }

  private async deleteUserData(userContext: CreatedUserContext) {
    if (userContext.inCognito) {
      await this.cognitoIsp.adminDeleteUser(
        { UserPoolId: this.config.cognitoUserPoolId, Username: userContext.user.username },
      );
    }
  }

  /**
   * Delete all users in Cognito that were created by this instance.
   */
  async dispose() {
    await Promise.all(this.createdUsers.map(async u => this.deleteUserData(u)));
    this.createdUsers.length = 0;
  }
}
