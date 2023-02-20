import 'source-map-support/register';

import { APIGatewayAuthorizerHandler, APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

import { JwtToken } from 'src/auth/JwtToken';
import { verify } from 'jsonwebtoken';

const auth0Secret = process.env.AUTH_0_SECRET;

export const handler: APIGatewayAuthorizerHandler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
    try {
        const decodedToken = verifyToken(event.authorizationToken);
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
};

function verifyToken(authHeader: string): JwtToken {
    if (!authHeader) {
        throw new Error('No authorization header');
    }

    if (!authHeader.toLocaleLowerCase().startsWith('bearer ')) {
        throw new Error('Invalid authorization header');
    }

    const split = authHeader.split(' ');
    const token = split[1];

    return verify(token, auth0Secret) as JwtToken;

    // A request has been authorized
}