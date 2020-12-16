import { Context, Handler } from 'aws-lambda';
import { Lambda } from '@aws-sdk/client-lambda';
import { InvocationMode } from './types';

export interface LambdaFunctionHandlerInvokerConfig<TEvent = any, TResult = any> {
  invocationMode?: InvocationMode;
  handler: Handler<TEvent, TResult>;
  awsRegion: string;
  lambdaFunctionName: string;
}

/**
 * Invokes Lambda functions from tests in 1 of 2 modes:
 *  - locally: by invoking the handler function passed into the constructor;
 *  - remotely: by using the AWS SDK to remotely invoke a deployed Lambda function.
 */
export class LambdaFunctionHandlerInvoker<TEvent = any, TResult = any> {
  static validModes = Object.values(InvocationMode);

  readonly handler?: Handler;

  private readonly lambdaClient?: Lambda;

  private readonly invocationMode: InvocationMode;

  constructor(private readonly config: LambdaFunctionHandlerInvokerConfig<TEvent, TResult>) {
    if (config.invocationMode) {
      this.invocationMode = config.invocationMode;
    } else if (process.env.TEST_MODE) {
      this.invocationMode = process.env.TEST_MODE as InvocationMode;
    } else {
      this.invocationMode = InvocationMode.LOCAL_HANDLER;
    }
    if (this.invocationMode === InvocationMode.REMOTE_TRIGGER && !config.lambdaFunctionName) {
      throw new Error('\'lambdaFunctionName\' must be specified in options.');
    }
    if (this.invocationMode === InvocationMode.LOCAL_HANDLER && !config.handler) {
      throw new Error('\'handler\' must be specified in options.');
    }
    this.handler = this.config.handler;

    if (this.invocationMode === InvocationMode.REMOTE_TRIGGER) {
      this.lambdaClient = new Lambda({
        region: config.awsRegion,
      });
    }
  }

  async invokeRemote(event: TEvent) {
    const result = await this.lambdaClient!.invoke({
      FunctionName: this.config.lambdaFunctionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(event),
    }).promise();
    if (result.FunctionError) {
      throw new Error(`FunctionError returned from ${this.config.lambdaFunctionName}. Error details: ${result.Payload}`);
    }
    return JSON.parse(result.Payload as string || '{}') as TResult;
  }

  async invokeLocal(event: TEvent) {
    const response = await this.handler!(event, {} as any as Context, () => {});
    return response as TResult;
  }

  async invoke(event: TEvent) {
    return this.invocationMode === InvocationMode.REMOTE_TRIGGER
      ? this.invokeRemote(event) : this.invokeLocal(event);
  }
}
