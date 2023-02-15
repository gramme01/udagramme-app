import 'source-map-support/register';

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { DynamoDB } from 'aws-sdk';

const docClient = new DynamoDB.DocumentClient();

const connectionTable = process.env.CONNECTIONS_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('WebSocket connect: ', event);

    const connectionId = event.requestContext.connectionId;
    const timestamp = new Date().toISOString();

    const item = {
        id: connectionId,
        timestamp
    };

    await docClient.put({
        TableName: connectionTable,
        Item: item
    }).promise();

    return {
        statusCode: 200,
        body: ''
    };
};