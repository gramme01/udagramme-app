import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'serverless-udagram-app',
  frameworkVersion: '3',
  plugins: [
    'serverless-esbuild',
  ],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      GROUPS_TABLE: 'Groups-${self:provider.stage}'
    },
    region: "${opt:region, 'us-east-1'}" as AWS['provider']['region'],
    stage: "${opt:stage, 'dev'}",
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['dynamodb:Scan', 'dynamodb:PutItem'],
        Resource:
          'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}'
      }
    ]
  },

  functions: {
    GetGroups: {
      handler: 'src/lambda/http/getGroups.handler',
      events: [
        {
          http: {
            method: 'get',
            path: 'groups',
            cors: true
          }
        }
      ]
    },

    CreateGroup: {
      handler: 'src/lambda/http/createGroup.handler',
      events: [
        {
          http: {
            method: 'post',
            path: 'groups',
            cors: true,
            reqValidatorName: 'RequestBodyValidator',
            documentation: {
              summary: 'Create a new group',
              description: 'Create a new group',
              requestModels: {
                'application/json': 'GroupRequest'
              }
            }

          }
        }
      ]
    }
  },

  resources: {
    Resources: {
      RequestBodyValidator: {
        Type: 'AWS::ApiGateway::RequestValidator',
        Properties: {
          Name: 'request-body-validator',
          RestApiId: {
            Ref: 'ApiGatewayRestApi'
          },
          ValidateRequestBody: true,
          ValidateRequestParameters: false,
        }
      },

      GroupsDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.GROUPS_TABLE}',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH'
            }
          ],
          BillingMode: 'PAY_PER_REQUEST'
        }
      }
    }
  },

  package: { individually: true },

  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10
    },
    documentation: {
      api: {
        info: {
          version: 'v1.0.0',
          title: 'Udagram API',
          description: 'Serverless application for image sharing',
        }
      },
      models: [
        {
          name: 'GroupRequest',
          contentType: 'application/json',
          schema: "${file(models/create-group-request.json)}"
        }
      ]
    }
  }
};

module.exports = serverlessConfiguration;
