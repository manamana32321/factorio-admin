import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || "factorio-backups";

export interface BackupObject {
  key: string;
  size: number;
  lastModified: Date;
  type: "auto" | "manual";
  filename: string;
}

function parseBackupKey(key: string): Pick<BackupObject, "type" | "filename"> {
  const parts = key.split("/");
  const type = parts[0] === "auto" ? "auto" : "manual";
  const filename = parts.slice(1).join("/");
  return { type, filename };
}

export async function ensureBucket() {
  try {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
  } catch (err: unknown) {
    const code = (err as { Code?: string }).Code;
    if (code !== "BucketAlreadyOwnedByYou" && code !== "BucketAlreadyExists") {
      throw err;
    }
  }
}

export async function listBackups(prefix?: string): Promise<BackupObject[]> {
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    })
  );

  return (result.Contents ?? [])
    .filter((obj) => obj.Key && obj.Size)
    .map((obj) => ({
      key: obj.Key!,
      size: obj.Size!,
      lastModified: obj.LastModified ?? new Date(),
      ...parseBackupKey(obj.Key!),
    }))
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

export async function uploadBackup(key: string, data: Buffer) {
  await ensureBucket();
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: "application/zip",
    })
  );
}

export async function downloadBackup(
  key: string
): Promise<ReadableStream | null> {
  const result = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );
  return (result.Body?.transformToWebStream() as ReadableStream) ?? null;
}

export async function getBackupSize(key: string): Promise<number> {
  const result = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );
  return result.ContentLength ?? 0;
}

export async function deleteBackup(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
