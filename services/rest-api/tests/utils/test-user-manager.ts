import { User } from '@svc/lib/types/sports-club-manager';
import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider';
import _ from 'lodash';
import { generateTestUser, randomPassword } from './test-data-generator';

/* eslint no-console: 0 */

export interface TestUserManagerConfig {
  cognitoUserPoolId: string;
  cognitoUserPoolClientId: string;
  region: string;
}

export interface AuthenticatedUser {
  user: User;
  idToken: string;
}

/**
 * Helper class for managing the creation and deletion of users in Cognito during test runs.
 */
export class TestUserManager {
  private readonly createdUsers: User[] = [];

  private readonly cognitoIsp: CognitoIdentityServiceProvider;

  constructor(private readonly config: TestUserManagerConfig) {
    this.cognitoIsp = new CognitoIdentityServiceProvider({ region: config.region });
  }

  async createUser(password: string) {
    const userProfile = generateTestUser();
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
    }).promise();
    const user: User = {
      ...userProfile,
      id: result.User?.Attributes?.find(a => a.Name === 'sub')?.Value!,
    };
    this.createdUsers.push(user);
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

  async signInUser(user: User, password: string) {
    try {
      const signinResult = await this.cognitoIsp.initiateAuth({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.config.cognitoUserPoolClientId,
        AuthParameters: {
          USERNAME: user.username,
          PASSWORD: password,
        },
      }).promise();

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
      }).promise();
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

  /**
   * Delete all users in Cognito that were created by this instance.
   */
  async dispose() {
    await Promise.all(this.createdUsers.map(async u => this.cognitoIsp.adminDeleteUser(
      { UserPoolId: this.config.cognitoUserPoolId, Username: u.username },
    ).promise()));
    this.createdUsers.length = 0;
  }
}
