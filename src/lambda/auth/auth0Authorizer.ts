import 'source-map-support/register';

import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

import { JwtToken } from 'src/auth/JwtToken';
import middy from 'middy';
import { secretsManager } from 'middy/middlewares';
import { verify } from 'jsonwebtoken';

const secretId = process.env.AUTH_0_SECRET_ID;
const secretField = process.env.AUTH_0_SECRET_FIELD;


export const handler = middy(
    async (event: APIGatewayTokenAuthorizerEvent, context): Promise<APIGatewayAuthorizerResult> => {
        try {
            const decodedToken = verifyToken(
                event.authorizationToken,
                context.AUTH0_SECRET[secretField],
            );
            console.log('User was authorized');

            return {
                principalId: decodedToken.sub,
                policyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Action: 'execute-api:Invoke',
                            Effect: 'Allow',
                            Resource: '*'
                        }
                    ]
                }
            };
        } catch (e) {
            console.log('User was not authorized', e.message);

            return {
                principalId: 'user',
                policyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Action: 'execute-api:Invoke',
                            Effect: 'Deny',
                            Resource: '*'
                        }
                    ]
                }
            };
        }
    }

);

function verifyToken(authHeader: string, secret: string): JwtToken {
    if (!authHeader) {
        throw new Error('No authorization header');
    }

    if (!authHeader.toLocaleLowerCase().startsWith('bearer ')) {
        throw new Error('Invalid authorization header');
    }

    const split = authHeader.split(' ');
    const token = split[1];

    return verify(token, secret) as JwtToken;

    // A request has been authorized
}

// async function getSecret() {
//     if (cachedSecret) return cachedSecret;

//     const data = await client.getSecretValue({
//         SecretId: secretId
//     }).promise();

//     cachedSecret = data.SecretString;
//     return JSON.parse(cachedSecret);
// }

handler.use(
    secretsManager({
        awsSdkOptions: {
            region: 'us-east-1'
        },
        cache: true,
        cacheExpiryInMillis: 60000,
        throwOnFailedCall: true,
        secrets: {
            AUTH0_SECRET: secretId
        }
    })
);