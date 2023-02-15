import 'source-map-support/register';

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { DynamoDB } from 'aws-sdk';

const docClient = new DynamoDB.DocumentClient();

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