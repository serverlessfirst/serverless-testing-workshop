import { DynamoDB, TransactWriteItemsInput, TransactWriteItemsOutput } from '@aws-sdk/client-dynamodb';
import log from '@dazn/lambda-powertools-logger';
import { map as mapPromise } from 'bluebird';

/**
 * `transactWrite` wrapper which acts as a workaround for SDK issue with not being able to parse transaction failures: https://github.com/aws/aws-sdk-js/issues/2464#issuecomment-503524701
 */
export async function executeTransactWrite(
  params: TransactWriteItemsInput, docClient: DynamoDB,
): Promise<TransactWriteItemsOutput> {
  const transactionRequest = await docClient.transactWriteItems(params);
  return transactionRequest;
  // let cancellationReasons: any[];
  // transactionRequest.on('extractError', (response) => {
  //   try {
  //     cancellationReasons = JSON.parse(response.httpResponse.body.toString()).CancellationReasons;
  //   } catch (err) {
  //     // suppress this just in case some types of errors aren't JSON parseable
  //     log.error('Error extracting cancellation error', err);
  //   }
  // });
  // return new Promise((resolve, reject) => {
  //   transactionRequest.send((err, response) => {
  //     if (err) {
  //       log.error('Error performing transactWrite', { cancellationReasons, err });
  //       return reject(err);
  //     }
  //     return resolve(response);
  //   });
  // });
}

const chunkArrayInGroups = (arr: any, size: number) => {
  const myArray = [];
  for (let i = 0; i < arr.length; i += size) {
    myArray.push(arr.slice(i, i + size));
  }
  return myArray;
};

export async function executeTransactWriteBatched(
  params: TransactWriteItemsInput, docClient: DynamoDB, batchSize = 25,
) {
  const batches = chunkArrayInGroups(params.TransactItems, batchSize);
  return mapPromise(
    batches, batch => executeTransactWrite({
      TransactItems: batch,
    }, docClient),
    { concurrency: 3 },
  );
}
