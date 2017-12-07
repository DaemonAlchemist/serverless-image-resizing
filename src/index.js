import AWS from 'aws-sdk';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

const S3 = new AWS.S3({
  signatureVersion: 'v4',
});

const BUCKET = process.env.AWS_BUCKET;
const URL = process.env.AWS_STATIC_HOST;

const sizePattern = / - ([0-9]+)x([0-9]+)\.(jpg|jpeg|png)$/;

export const resizeImage = (callback, image, bucket, url, verbose = false) => {
    const matches       = sizePattern.exec(image);
    const width         = +matches[1];
    const height        = +matches[2];
    const imageOriginal = image.replace(sizePattern, "." + matches[3]);

    if(verbose) {
        console.log("Image: " + image);
        console.log("Width: " + width);
        console.log("Height: " + height)
        console.log("Original: " + imageOriginal);
    }

    S3.getObject({Bucket: bucket, Key: imageOriginal})
        .promise()
        .then(data => sharp(data.Body)
            .resize(width, height)
            .toFormat('png')
            .toBuffer()
        )
        .then(buffer => S3.putObject({
                Body: buffer,
                Bucket: bucket,
                ContentType: 'image/png',
                Key: image,
                ACL: 'public-read',
            }).promise()
        )
        .then(() => callback(null, {
                statusCode: '301',
                headers: {'location': `http://${url}/${image}`},
                body: '',
            })
        )
        .catch(err => callback(err));
}

export const handler = (event, context, callback) => resizeImage(callback, event.pathParameters.image.replace(/%20/g, " "), BUCKET, URL);

//Testing
const image = 'Adarien - 300x200.png';
const callback = (_, results) => {
    console.log(_ || results);
};
resizeImage(callback, image, BUCKET, URL, true);
