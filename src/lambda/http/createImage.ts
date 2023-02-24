import 'source-map-support/register';

import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { cors } from 'middy/middlewares';
import middy from 'middy';
import { v4 as uuidv4 } from 'uuid';

const XAWS = AWSXRay.captureAWS(AWS);

const docClient = new XAWS.DynamoDB.DocumentClient();

const s3 = new XAWS.S3({
    signatureVersion: 'v4',
});

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;
const bucketName = process.env.IMAGES_S3_BUCKET;
const urlExpiration = +process.env.SIGNED_URL_EXPIRATION;

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Caller event: ', event);
    const groupId = event.pathParameters.groupId;
    const validGroupId = await groupExists(groupId);

    if (!validGroupId) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                error: 'Group does not exist'
            }),
        };
    }

    const imageId = uuidv4();
    const newItem = await createImage(groupId, imageId, event);

    const uploadUrl = getUploadUrl(imageId);

    return {
        statusCode: 201,
        body: JSON.stringify({
            newItem,
            uploadUrl,
        })
    };
});

function getUploadUrl(imageId: string) {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: imageId,
        Expires: urlExpiration
    });
}

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
        imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`,
        ...parsedBody,
    };

    console.log('Storing new image: ', newImage);
    await docClient.put({
        TableName: imagesTable,
        Item: newImage
    }).promise();

    return newImage;

}

handler.use(
    cors({
        credentials: true
    })
);