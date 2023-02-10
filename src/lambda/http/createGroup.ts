import 'source-map-support/register';

import * as AWS from 'aws-sdk';

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { v4 as uuidv4 } from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient();
const groupsTable = process.env.GROUPS_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event);

    const itemId = uuidv4();
    const parsedBody = JSON.parse(event.body);

    const newItem = {
        id: itemId,
        ...parsedBody
    };

    await docClient.put({
        TableName: groupsTable,
        Item: newItem
    }).promise();

    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newItem)
    };
};