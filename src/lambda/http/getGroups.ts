import 'source-map-support/register';

import * as AWS from 'aws-sdk';

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

const docClient = new AWS.DynamoDB.DocumentClient();
const groupTable = process.env.GROUPS_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event);

    const result = await docClient.scan({
        TableName: groupTable
    }).promise();

    const items = result.Items;

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            items
        })
    };
};
