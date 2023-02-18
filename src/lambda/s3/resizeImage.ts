import 'source-map-support/register';

import { S3Event, S3EventRecord, SNSEvent, SNSHandler } from 'aws-lambda';

import Jimp from 'jimp';
import { S3 } from 'aws-sdk';

const s3 = new S3();

const imagesBucketName = process.env.IMAGES_S3_BUCKET;
const thumbnailsBucketName = process.env.THUMBNAILS_S3_BUCKET;

export const handler: SNSHandler = async (event: SNSEvent) => {
    console.log('Processing SNS event: ', JSON.stringify(event));

    for (const snsRecord of event.Records) {
        const s3EventStr = snsRecord.Sns.Message;
        console.log('Processing S3 event: ', s3EventStr);
        const s3Event: S3Event = JSON.parse(s3EventStr);

        for (const record of s3Event.Records) {
            await processImage(record);
        }
    }
};

async function processImage(record: S3EventRecord) {
    const key = record.s3.object.key;
    console.log('Processing S3 item with key: ', key);

    const response = await s3.getObject({
        Bucket: imagesBucketName,
        Key: key
    }).promise();

    const body = response.Body as Buffer;
    const image = await Jimp.read(body);

    console.log('Resizing Image');
    image.resize(150, Jimp.AUTO);

    const mime = image.getMIME();
    const convertedBuffer = await image.getBufferAsync(mime);

    console.log('Writing image back to S3 bucket: ', thumbnailsBucketName);

    await s3.putObject({
        Bucket: thumbnailsBucketName,
        Key: `${key}.jpeg`,
        Body: convertedBuffer
    }).promise();
}