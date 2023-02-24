import 'source-map-support/register';

import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

const XAWS = AWSXRay.captureAWS(AWS);

const docClient = new XAWS.DynamoDB.DocumentClient();

const connectionTable = process.env.CONNECTIONS_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('WebSocket disconnect: ', event);

    const connectionId = event.requestContext.connectionId;

    const key = {
        id: connectionId,
    };

    await docClient.delete({
        TableName: connectionTable,
        Key: key
    }).promise();

    return {
        statusCode: 200,
        body: ''
    };
};