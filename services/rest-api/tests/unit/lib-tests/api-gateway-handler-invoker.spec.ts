import axios, { AxiosStatic } from 'axios';
import {
  ApiGatewayHandlerInvoker, ApiGatewayInvocation,
} from '@tests/utils/handler-invokers/api-gateway-handler-invoker';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { InvocationMode } from '@tests/utils/handler-invokers/types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<AxiosStatic>;

describe('ApiGatewayHandlerInvoker', () => {
  describe('ctor', () => {
    it('throws error when invocationMode=REMOTE_TRIGGER and baseUrl=undefined', () => {
      expect(() => new ApiGatewayHandlerInvoker(
        { invocationMode: InvocationMode.REMOTE_TRIGGER },
      )).toThrowError(/baseUrl/);
    });

    it('throws error when invocationMode=LOCAL_HANDLER and handler=undefined', () => {
      expect(() => new ApiGatewayHandlerInvoker(
        { invocationMode: InvocationMode.LOCAL_HANDLER },
      )).toThrowError(/handler/);
    });
  });

  describe('.invoke()', () => {
    describe('when invocationMode=LOCAL_HANDLER', () => {
      const invocationMode = InvocationMode.LOCAL_HANDLER;

      it('parses pathParameters correctly', async () => {
        const handler = jest.fn();
        const apiClient = new ApiGatewayHandlerInvoker({ invocationMode, handler });
        const params: ApiGatewayInvocation = {
          event: {
            pathTemplate: '/groups/{groupId}',
            pathParameters: { groupId: '12345' },
            httpMethod: 'GET',
          },
        };

        await apiClient.invoke(params);

        expect(handler).toHaveBeenCalledTimes(1);
        const eventArg: APIGatewayProxyEventV2 = handler.mock.calls[0][0];
        expect(eventArg.pathParameters?.groupId).toEqual(params.event.pathParameters!.groupId);
        expect(eventArg.rawPath).toEqual(`/groups/${params.event.pathParameters!.groupId}`);
      });

      it('throws error when pathParameter not included in pathTemplate', async () => {
        const handler = jest.fn();
        const apiClient = new ApiGatewayHandlerInvoker({ invocationMode, handler });
        const params: ApiGatewayInvocation = {
          event: {
            pathTemplate: '/groups/{groupId}',
            httpMethod: 'GET',
          },
        };

        expect(apiClient.invoke(params)).rejects.toThrowError(/pathParameters/);
      });

      it('correctly populates user data into JWT claims', async () => {
        const handler = jest.fn();
        const apiClient = new ApiGatewayHandlerInvoker({ invocationMode, handler });
        const user = {
          id: '1234',
          name: 'my name',
          username: 'myname_1234',
          email: 'myname_1234@example.com',
        };
        const params: ApiGatewayInvocation = {
          event: {
            pathTemplate: '/groups',
            httpMethod: 'GET',
          },
          userContext: {
            idToken: 'abcd',
            user,
          },
        };

        await apiClient.invoke(params);

        expect(handler).toHaveBeenCalledTimes(1);

        const eventArg: APIGatewayProxyEventV2 = handler.mock.calls[0][0];
        const claims = eventArg.requestContext.authorizer?.jwt.claims!;
        expect(claims).toBeTruthy();
        expect(claims['cognito:username']).toEqual(user.username);
        expect(claims.email).toEqual(user.email);
        expect(claims.name).toEqual(user.name);
      });

      it('correctly populates Authorization HTTP header with idToken', async () => {
        const handler = jest.fn();
        const apiClient = new ApiGatewayHandlerInvoker({ invocationMode, handler });
        const user = {
          id: '1234',
          name: 'my name',
          username: 'myname_1234',
          email: 'myname_1234@example.com',
        };
        const params: ApiGatewayInvocation = {
          event: {
            pathTemplate: '/groups',
            httpMethod: 'GET',
          },
          userContext: {
            idToken: 'abcd',
            user,
          },
        };

        await apiClient.invoke(params);

        expect(handler).toHaveBeenCalledTimes(1);

        const eventArg: APIGatewayProxyEventV2 = handler.mock.calls[0][0];
        expect(eventArg.headers.Authorization).toEqual(params.userContext!.idToken);
      });
    });

    describe('when invocationMode=REMOTE_TRIGGER', () => {
      const invocationMode = InvocationMode.REMOTE_TRIGGER;
      const baseUrl = 'https://example.com';

      beforeAll(() => {
        mockedAxios.create.mockReturnThis();
      });

      beforeEach(() => {
        mockedAxios.request.mockReset();
      });

      it('correctly populates Authorization HTTP header with idToken', async () => {
        mockedAxios.request.mockResolvedValue({ });
        const apiClient = new ApiGatewayHandlerInvoker({ invocationMode, baseUrl });
        const user = {
          id: '1234',
          name: 'my name',
          username: 'myname_1234',
          email: 'myname_1234@example.com',
        };
        const params: ApiGatewayInvocation = {
          event: {
            pathTemplate: '/groups',
            httpMethod: 'GET',
          },
          userContext: {
            idToken: 'abcd',
            user,
          },
        };

        await apiClient.invoke(params);

        expect(mockedAxios.request).toHaveBeenCalledTimes(1);
        const sentRequest = mockedAxios.request.mock.calls[0][0];
        expect(sentRequest.headers?.Authorization).toEqual(params.userContext!.idToken);
      });

      it('correctly passes query string params', async () => {
        mockedAxios.request.mockResolvedValue({ });
        const apiClient = new ApiGatewayHandlerInvoker({ invocationMode, baseUrl });
        const params: ApiGatewayInvocation = {
          event: {
            pathTemplate: '/groups',
            httpMethod: 'GET',
            queryStringParameters: {
              limit: '2',
            },
          },
        };

        await apiClient.invoke(params);

        expect(mockedAxios.request).toHaveBeenCalledTimes(1);
        const sentRequest = mockedAxios.request.mock.calls[0][0];
        expect(sentRequest.params.limit).toEqual(params.event.queryStringParameters!.limit);
      });

      it('maps HTTP 40X errors to a correct statusCode response', async () => {
        const errorMsg = 'Bad request error';
        mockedAxios.request.mockRejectedValue({
          response: {
            status: 400,
            headers: {},
            data: errorMsg,
          },
        });
        const apiClient = new ApiGatewayHandlerInvoker({ invocationMode, baseUrl });
        const params: ApiGatewayInvocation = {
          event: {
            pathTemplate: '/groups',
            httpMethod: 'GET',
          },
        };

        const response = await apiClient.invoke(params);
        expect(mockedAxios.request).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual(errorMsg);
      });
    });
  });
});
