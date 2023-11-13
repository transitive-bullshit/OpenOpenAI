import {
  DeleteObjectCommand,
  type DeleteObjectCommandInput,
  GetObjectCommand,
  type GetObjectCommandInput,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3'

import * as config from './config'

// This storage client is designed to work with any S3-compatible storage provider.
// For Cloudflare R2, see https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/

const bucket = config.storage.bucket

export const S3 = new S3Client({
  region: process.env.S3_REGION ?? 'auto',
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!
  }
})

// This ensures that buckets are created automatically if they don't exist on
// Cloudflare R2. It won't affect other providers.
// @see https://developers.cloudflare.com/r2/examples/aws/custom-header/
S3.middlewareStack.add(
  (next, _) => async (args) => {
    const r = args.request as RequestInit
    r.headers = {
      'cf-create-bucket-if-missing': 'true',
      ...r.headers
    }

    return next(args)
  },
  { step: 'build', name: 'customHeaders' }
)

export async function getObject(
  key: string,
  opts?: Omit<GetObjectCommandInput, 'Bucket' | 'Key'>
) {
  return S3.send(new GetObjectCommand({ Bucket: bucket, Key: key, ...opts }))
}

export async function putObject(
  key: string,
  value: PutObjectCommandInput['Body'],
  opts?: Omit<PutObjectCommandInput, 'Bucket' | 'Key' | 'Body'>
) {
  return S3.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: value, ...opts })
  )
}

export async function deleteObject(
  key: string,
  opts?: Omit<DeleteObjectCommandInput, 'Bucket' | 'Key'>
) {
  return S3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key, ...opts }))
}

export function getS3ObjectUrl(key: string) {
  return `${process.env.S3_ENDPOINT}/${bucket}/${key}`
}
