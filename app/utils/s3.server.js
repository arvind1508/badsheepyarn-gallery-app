import { writeAsyncIterableToWritable } from "@remix-run/node";
import AWS from "aws-sdk";
import { PassThrough } from "stream";

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

export const s3UploadHandler = async ({ 
  name,
  contentType,
  data,
  filename
}) => {
  if (name !== "img" || !filename) return;

  const stream = new PassThrough();
  console.log("process.env.AWS_BUCKET_NAME", process.env.AWS_BUCKET_NAME);
  const upload = s3.upload({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${Date.now()}-${filename}`,
    Body: stream,
    ContentType: contentType
  });
  console.log("upload", upload);

  await Promise.all([
    upload.promise(),
    writeAsyncIterableToWritable(data, stream)
  ]);

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
};