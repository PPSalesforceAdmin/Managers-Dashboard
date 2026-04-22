import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

async function main(): Promise<void> {
  const endpoint = process.env.S3_ENDPOINT!;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!;
  const region = process.env.S3_REGION ?? "auto";

  console.log("endpoint:", endpoint);
  console.log("bucket configured:", process.env.S3_BUCKET);

  for (const forcePathStyle of [true, false]) {
    const client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle,
    });
    try {
      const res = await client.send(new ListBucketsCommand({}));
      console.log(
        `\nforcePathStyle=${forcePathStyle} → ListBuckets OK, buckets=`,
        res.Buckets?.map((b) => b.Name) ?? [],
      );
    } catch (err) {
      console.log(
        `\nforcePathStyle=${forcePathStyle} → ListBuckets FAILED:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

main().catch((err) => {
  console.error("DIAG_FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
