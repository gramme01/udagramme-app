import 'source-map-support/register';

import * as AWS from 'aws-sdk';

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

import { v4 as uuidv4 } from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Caller event: ', event);
    const groupId = event.pathParameters.groupId;
    const validGroupId = await groupExists(groupId);

    if (!validGroupId) {
        return {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Group does not exist'
            }),
        };
    }

    const imageId = uuidv4();
    const newItem = await createImage(groupId, imageId, event);

    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newItem })

    };

};

async function groupExists(groupId: string) {
    const result = await docClient.get({
        TableName: groupsTable,
        Key: {
            id: groupId,
        }
    }).promise();

    console.log('Get group: ', result);
    return !!result.Item;
}

async function createImage(groupId: string, imageId: string, event: APIGatewayProxyEvent) {
    const timestamp = new Date().toISOString();
    const parsedBody = JSON.parse(event.body);

    const newImage = {
        groupId,
        timestamp,
        imageId,
        ...parsedBody,
    };

    console.log('Storing new image: ', newImage);
    await docClient.put({
        TableName: imagesTable,
        Item: newImage
    }).promise();

    return newImage;

}

