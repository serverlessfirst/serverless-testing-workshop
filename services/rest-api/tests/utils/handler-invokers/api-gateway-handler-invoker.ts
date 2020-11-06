import _get from 'lodash/get';
import _omit from 'lodash/omit';
import { v4 as uuidv4 } from 'uuid';
import {
  Context, APIGatewayProxyResult, APIGatewayProxyEventV2,
} from 'aws-lambda';
import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import { getClaimsFromUser } from '@svc/lib/auth/claims-parser';
import { AuthenticatedUser } from '../test-user-manager';

/**
 * Partially typed version of APIGatewayProxyEvent.
 * Any empty fields that are always populated in APIGW events will be given a default by the invoker.
 */
export interface SimpleAPIGatewayProxyEvent {
  httpMethod: string;
  pathTemplate: string;
  body?: any;
  headers?: { [name: string]: string };
  pathParameters?: { [name: string]: string };
  queryStringParameters?: { [name: string]: string };
  requestContext?: {
    authorizer?: {
      jwt: {
        claims: { [name: string]: string | number | boolean | string[] };
        scopes: string[];
      };
    };
  };
}

export interface ApiGatewayInvocation {
  event: SimpleAPIGatewayProxyEvent;
  userContext?: AuthenticatedUser;
}

export enum InvocationMode {
  LOCAL_HANDLER = 'LOCAL_HANDLER',
  REMOTE_TRIGGER = 'REMOTE_TRIGGER',
}

export type ApiGatewayInvokerHandler =
  (event: APIGatewayProxyEventV2, context: Context) => Promise<APIGatewayProxyResult>;

export interface ApiGatewayHandlerInvokerOptions {
  invocationMode?: InvocationMode;
  baseUrl: string;
  handler?: ApiGatewayInvokerHandler;
}

export class ApiGatewayHandlerInvoker {
  readonly invocationMode: InvocationMode;

  readonly baseUrl: string;

  static validModes = Object.values(InvocationMode);

  readonly axiosClient: AxiosInstance;

  readonly handler?: ApiGatewayInvokerHandler;

  constructor(options: ApiGatewayHandlerInvokerOptions) {
    if (options.invocationMode) {
      this.invocationMode = options.invocationMode;
    } else if (process.env.TEST_MODE) {
      if (!ApiGatewayHandlerInvoker.validModes.includes(process.env.TEST_MODE as InvocationMode)) {
        throw new Error(`Invalid TEST_MODE: ${process.env.TEST_MODE}. Valid values are ${ApiGatewayHandlerInvoker.validModes.join(',')}`);
      }
      this.invocationMode = process.env.TEST_MODE as InvocationMode;
    } else {
      this.invocationMode = InvocationMode.LOCAL_HANDLER;
    }
    if (this.invocationMode === InvocationMode.REMOTE_TRIGGER && !options.baseUrl) {
      throw new Error('\'baseUrl\' must be specified in options.');
    }
    if (this.invocationMode === InvocationMode.LOCAL_HANDLER && !options.handler) {
      throw new Error('\'handler\' must be specified in options.');
    }
    this.baseUrl = options.baseUrl;
    this.handler = options.handler;
    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
    });
  }

  async invoke(handlerParams: ApiGatewayInvocation) {
    if (this.invocationMode === InvocationMode.REMOTE_TRIGGER) {
      return this.invokeApiGatewayRemote(handlerParams);
    }
    return this.invokeApiGatewayLocal(handlerParams);
  }

  private async invokeApiGatewayLocal(invocation: ApiGatewayInvocation) {
    const requestId = uuidv4();
    const path = parsePath(invocation.event.pathTemplate, invocation.event.pathParameters);

    // create an APIGW event, stubbing out values that won't be needed by integration tests
    const event = {
      version: '2.0',
      routeKey: '$default',
      isBase64Encoded: false,
      rawPath: path,
      rawQueryString: 'stubbed',
      requestContext: {
        requestId,
        ...invocation.event.requestContext || {},
        // if user is set, then supply the user claims in the requestContext
        ...(invocation.userContext && {
          authorizer: {
            jwt: {
              claims: getClaimsFromUser(invocation.userContext.user),
            },
          },
        }),
      },
      headers: invocation.event.headers || {},
      body: (typeof invocation.event.body === 'object' ? JSON.stringify(invocation.event.body) : invocation.event.body) || null,
      pathParameters: invocation.event.pathParameters,
      queryStringParameters: invocation.event.queryStringParameters,
      ..._omit(invocation.event, 'body'),
    };
    if (!event.headers['Content-Type']) {
      event.headers['Content-Type'] = 'application/json';
    }
    // Create a stubbed context
    const context: Context = {
      awsRequestId: requestId,
      callbackWaitsForEmptyEventLoop: false,
      functionName: '',
      memoryLimitInMB: '0',
      functionVersion: '0.0.0',
      invokedFunctionArn: '',
      logGroupName: '',
      logStreamName: '',
      getRemainingTimeInMillis: () => 0,
      done: () => { },
      fail: () => { },
      succeed: () => { },
    };
    const response = await this.handler!(event as any as APIGatewayProxyEventV2, context);
    const contentType = _get(response, 'headers.Content-Type', 'application/json');
    if (response.body && contentType === 'application/json') {
      try {
        response.body = JSON.parse(response.body);
      } catch (error) {
        // probably because string was returned as root of json response
      }
    }
    return response;
  }

  private async invokeApiGatewayRemote(invocation: ApiGatewayInvocation) {
    const req: AxiosRequestConfig = {
      method: invocation.event.httpMethod as Method,
      url: parsePath(invocation.event.pathTemplate, invocation.event.pathParameters),
      headers: {
        ...invocation.event.headers,
        ...(invocation.userContext && {
          Authorization: invocation.userContext.idToken,
        }),
      },
      params: {
        ...invocation.event.queryStringParameters,
      },
      data: invocation.event.body,
    };
    try {
      const res = await this.axiosClient(req);
      return {
        statusCode: res.status,
        body: res.data,
        headers: res.headers,
      } as APIGatewayProxyResult;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return {
          statusCode: error.response.status,
          headers: error.response.headers,
          body: error.response.data,
        };
      }
      throw error;
    }
  }
}

function parsePath(pathTemplate: string, pathParameters: any) {
  return pathTemplate.replace(
    /\{\s*([^}]+?)\s*\}/g,
    (match, key) => {
      if (!pathParameters || typeof pathParameters[key] === 'undefined') {
        throw new Error(`Value for path parameter field ${match} defined in path template was not found in provided pathParameters object.`);
      }
      return pathParameters[key];
    },
  );
}
