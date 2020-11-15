/** @typedef {import('serverless')} Serverless */
/** @typedef {import('serverless/aws').Resources} Resources */

/**
 * @param {Serverless} slsRuntime
 */
module.exports = (slsRuntime) => {
  // Dynamically load in E2E test resources based on the stage
  const stage = slsRuntime.getProvider('aws').getStage();
  const loadE2EResources = stage !== 'prod';
  if (!loadE2EResources) {
    return {
      Resources: {},
    };
  }

  /** @type {Resources} */
  const resources = {
    Resources: {
      E2ETestEventBridgeTargetQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          MessageRetentionPeriod: 300, // remove msgs after 5 mins
        },
      },
      E2ERouteEventsToQueueRule: {
        Type: 'AWS::Events::Rule',
        DependsOn: [
          'E2ETestEventBridgeTargetQueue',
        ],
        Properties: {
          // eslint-disable-next-line no-template-curly-in-string
          EventBusName: '${cf:${self:custom.infraStack}.ServiceBusArn}',
          State: 'ENABLED',
          EventPattern: {
            // Subscribe to all events published by our rest-api service
            source: ['rest-api'],
          },
          Targets: [
            {
              Id: 'E2ETestEventBridgeTargetQueue',
              Arn: {
                'Fn::GetAtt': ['E2ETestEventBridgeTargetQueue', 'Arn'],
              },
            },
          ],
        },
      },
      E2ETestEventBridgeTargetQueuePolicy: {
        Type: 'AWS::SQS::QueuePolicy',
        DependsOn: [
          'E2ETestEventBridgeTargetQueue',
        ],
        Properties: {
          Queues: [
            { Ref: 'E2ETestEventBridgeTargetQueue' },
          ],
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: 'SQS:SendMessage',
                Resource: {
                  'Fn::GetAtt': ['E2ETestEventBridgeTargetQueue', 'Arn'],
                },
                Condition: {
                  ArnEquals: {
                    'aws:SourceArn': {
                      'Fn::GetAtt': ['E2ERouteEventsToQueueRule', 'Arn'],
                    },
                  },
                },
              },
            ],
          },
        },
      },
    },
    Outputs: {
      E2ETestEventBridgeTargetQueueUrl: {
        Value: {
          Ref: 'E2ETestEventBridgeTargetQueue',
        },
      },
    },
  };

  return resources;
};
