import 'source-map-support/register';

import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent, APIGatewayTokenAuthorizerHandler } from 'aws-lambda';

import { JwtToken } from 'src/auth/JwtToken';
import { verify } from 'jsonwebtoken';

const cert = `-----BEGIN CERTIFICATE-----
MIIDHTCCAgWgAwIBAgIJSYeJNKz0rmQNMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV
BAMTIWRldi11eWNoaWg0cWE4MHNuYWJzLnVzLmF1dGgwLmNvbTAeFw0yMzAyMjAx
MTE0MDlaFw0zNjEwMjkxMTE0MDlaMCwxKjAoBgNVBAMTIWRldi11eWNoaWg0cWE4
MHNuYWJzLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBALAaJ5Bc+6qJasb6jMXthdP7wcehsJzrqbgGryizgscAvDKU6I5tNj0zyE/n
zbRT3GnLfHIjORunC99Z2ttlccjAhPdhxX6OtFw7p/+Xk4tK9dSI8sDddhc1qRK3
paxM5ZBsln+TqknSTEBRW5Qzyi5+fq5PSkZsjZadOn+MBWnzzdhAEmQaBrk9nEMC
u37hS8QPbZplNw/6bdGUBODmRv9pDvXsUJzDUe19Jtrlqq4dDrYENdlz0WtV5Rmd
ogkzQ62aAV5gH/UV7ourjh3/o6UHim4xFVssHU62TCkD6jq1J7ROz47MbYXDTACv
+Sx5m2L1sP3FoMurb1kMZL3R9bkCAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUpZVWLvz2Tg/2bhRJwg8hyYLNnlwwDgYDVR0PAQH/BAQDAgKEMA0G
CSqGSIb3DQEBCwUAA4IBAQAB8PRrZ1IoxiHS3/SkEdzGl+FPfFNJru0bspnOYrFp
MGATlhF4DQuG3Ys4uSKs9IiP84uijTVxGrUCx635YiVc+ue1z6lmSv2V0QhBhGWb
0qfSBRHNFgjCZ63bazN+93R8EdOt/sIj1DHKQo5wpQLoi+x038ayrf6rFqUROPRv
8jqGLFvWAnXJ6kX15mD6tQQovftQ3GT3KJ4X2mVXGmqBNHhenPXY4/H+OX9VwJ6T
x6jbCAZqbPHtTiQzDQys77D/FRDA2iRgkHFfKlF3HScq0qfq8B2iPICpr3AVeHjS
OQHVZvXat47OMD3TZHtg1C9LEhcTCUJMPq0kozm0o7p4
-----END CERTIFICATE-----`;


export const handler: APIGatewayTokenAuthorizerHandler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
	try {
		const jwtToken = verifyToken(event.authorizationToken);
		console.log('User was authorized ', jwtToken);

		return {
			principalId: jwtToken.sub,
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
		throw new Error('No authentication header');
	}

	if (!authHeader.toLowerCase().startsWith('bearer ')) {
		throw new Error('Invalid authentication header');
	}

	const split = authHeader.split(' ');
	const token = split[1];

	return verify(token, cert, { algorithms: ['RS256'] }) as JwtToken;
}