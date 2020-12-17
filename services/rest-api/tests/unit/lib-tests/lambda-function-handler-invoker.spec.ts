import '@aws-sdk/client-lambda';
import { LambdaFunctionHandlerInvoker, LambdaFunctionHandlerInvokerConfig } from '@tests/utils/handler-invokers/lambda-function-handler-invoker';
import { InvocationMode } from '@tests/utils/handler-invokers/types';

const mockedLambdaInvoke = jest.fn();

jest.mock('@aws-sdk/client-lambda', () => jest.fn(() => {
  return { invoke: mockedLambdaInvoke };
}));

describe('LambdaFunctionHandlerInvoker', () => {
  const awsRegion = 'eu-west-1';
  const lambdaFunctionName = 'mockedFunctionName';
  const handler = jest.fn();

  describe('ctor', () => {
    it('throws error when invocationMode=REMOTE_TRIGGER and lambdaFunctionName=undefined', () => {
      expect(() => new LambdaFunctionHandlerInvoker(
        { invocationMode: InvocationMode.REMOTE_TRIGGER } as LambdaFunctionHandlerInvokerConfig,
      )).toThrowError(/lambdaFunctionName/);
    });

    it('throws error when invocationMode=LOCAL_HANDLER and handler=undefined', () => {
      expect(() => new LambdaFunctionHandlerInvoker(
        { invocationMode: InvocationMode.LOCAL_HANDLER } as LambdaFunctionHandlerInvokerConfig,
      )).toThrowError(/handler/);
    });
  });

  describe('.invoke()', () => {
    describe('when invocationMode=LOCAL_HANDLER', () => {
      const invocationMode = InvocationMode.LOCAL_HANDLER;

      it('invokes local handler function with same event argument', async () => {
        const invoker = new LambdaFunctionHandlerInvoker({
          invocationMode, handler, lambdaFunctionName, awsRegion,
        });
        const evt = {
          foo: 'ls rush in',
          bar: 'bq',
        };

        await invoker.invoke(evt);

        expect(handler).toHaveBeenCalledTimes(1);

        const eventArg = handler.mock.calls[0][0];
        expect(eventArg).toEqual(evt);
      });
    });

    describe('when invocationMode=REMOTE_TRIGGER', () => {
      const invocationMode = InvocationMode.REMOTE_TRIGGER;

      beforeEach(() => {
        mockedLambdaInvoke.mockReset();
      });

      it('invokes Lambda API with correct payload', async () => {
        const invoker = new LambdaFunctionHandlerInvoker<any, any>({
          invocationMode, handler, lambdaFunctionName, awsRegion,
        });
        mockedLambdaInvoke.mockImplementation(() => Promise.resolve({}));
        const evt = {
          foo: 'ls rush in',
          bar: 'bq',
        };

        await invoker.invoke(evt);

        expect(mockedLambdaInvoke).toHaveBeenCalledTimes(1);
        const expectedRequest = {
          FunctionName: lambdaFunctionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(evt),
        };
        const sentRequest = mockedLambdaInvoke.mock.calls[0][0];
        expect(sentRequest).toEqual(expectedRequest);
      });
    });
  });
});
