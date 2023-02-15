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
      GROUPS_TABLE: 'Groups-${self:provider.stage}',
      IMAGES_TABLE: 'Images-${self:provider.stage}',
      IMAGE_ID_INDEX: 'ImageIdIndex',
      IMAGES_S3_BUCKET: 'serverless-udagram-grammea-image-${self:provider.stage}',
      SIGNED_URL_EXPIRATION: '300'
    },
    region: "${opt:region, 'us-east-1'}" as AWS['provider']['region'],
    stage: "${opt:stage, 'dev'}",
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['dynamodb:Scan', 'dynamodb:PutItem', 'dynamodb:GetItem'],
        Resource:
          'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}'
      },
      {
        Effect: 'Allow',
        Action: ['dynamodb:Query', 'dynamodb:PutItem'],
        Resource:
          'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}'
      },
      {
        Effect: 'Allow',
        Action: ['dynamodb:Query'],
        Resource:
          'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}'
      },
      {
        Effect: 'Allow',
        Action: ['s3:PutObject', 's3:GetObject'],
        Resource:
          'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*'
      },
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
            request: {
              schemas: {
                'application/json': '${file(models/create-group-request.json)}'
              }
            }
          }
        }
      ]
    },

    GetImages: {
      handler: 'src/lambda/http/getImages.handler',
      events: [
        {
          http: {
            method: 'get',
            path: 'groups/{groupId}/images',
            cors: true,
          }
        }
      ]
    },

    GetImage: {
      handler: 'src/lambda/http/getImage.handler',
      events: [
        {
          http: {
            method: 'get',
            path: 'images/{imageId}',
            cors: true,
          }
        }
      ]
    },

    CreateImage: {
      handler: 'src/lambda/http/createImage.handler',
      events: [
        {
          http: {
            method: 'post',
            path: 'groups/{groupId}/images',
            cors: true,
            request: {
              schemas: {
                'application/json': '${file(models/create-image-request.json)}'
              }
            }
          }
        }
      ]
    },

    SendUploadNotifications: {
      handler: 'src/lambda/s3/sendNotifications.handler',
      events: [
        {
          s3: {
            bucket: {
              "Ref": "AttachmentsBucket"
            },
            event: 's3:ObjectCreated:*',
            existing: true
          }
        }
      ]

    }
  },

  resources: {
    Resources: {
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
      },

      ImagesDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.IMAGES_TABLE}',
          AttributeDefinitions: [
            {
              AttributeName: 'groupId',
              AttributeType: 'S'
            },
            {
              AttributeName: 'timestamp',
              AttributeType: 'S'
            },
            {
              AttributeName: 'imageId',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'groupId',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'timestamp',
              KeyType: 'RANGE'
            }
          ],
          GlobalSecondaryIndexes: [{
            IndexName: '${self:provider.environment.IMAGE_ID_INDEX}',
            KeySchema: [
              {
                AttributeName: 'imageId',
                KeyType: 'HASH'
              }
            ],
            Projection: {
              ProjectionType: 'ALL',
            }
          }],
          BillingMode: 'PAY_PER_REQUEST'
        }
      },

      AttachmentsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: '${self:provider.environment.IMAGES_S3_BUCKET}',
          CorsConfiguration: {
            CorsRules: [
              {

                AllowedOrigins: ['*'],
                AllowedHeaders: ['*'],
                AllowedMethods: [
                  'GET',
                  'PUT',
                  'POST',
                  'DELETE',
                  'HEAD'
                ],
                MaxAge: 3000
              }
            ]
          }
        }
      },

      BucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          PolicyDocument: {
            Id: 'MyPolicy',
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadForGetBucketObjects',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*'
              }
            ]
          },
          Bucket: {
            "Ref": "AttachmentsBucket"
          }
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

  }
};

module.exports = serverlessConfiguration;
