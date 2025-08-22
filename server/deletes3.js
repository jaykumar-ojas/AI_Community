require("dotenv").config();
const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const bucketName = process.env.BUCKET;
const bucketRegion = process.env.REGION;
const accessKey = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

async function emptyBucket() {
  try {
    let continuationToken = undefined;
    let totalDeleted = 0;

    while (true) {
      // list objects
      const listResponse = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
        })
      );

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log("✅ Bucket is already empty");
        break;
      }

      // delete batch
      const deleteResponse = await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
          },
        })
      );

      totalDeleted += deleteResponse.Deleted.length;
      console.log(`🗑️ Deleted ${deleteResponse.Deleted.length} objects`);

      if (!listResponse.IsTruncated) {
        break;
      }

      continuationToken = listResponse.NextContinuationToken;
    }

    console.log(`✅ All done. Total deleted: ${totalDeleted}`);
  } catch (err) {
    console.error("❌ Error emptying bucket:", err);
  }
}

emptyBucket();
