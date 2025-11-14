import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { readFile, writeFile } from "fs/promises"
import path from "path"
import { Encryption } from "../services/encryption.service"

export class S3Storage {
  private useS3: boolean
  private s3Client?: S3Client
  private localStoragePath: string
  constructor() {
    this.useS3 = process.env.USE_S3 === "true"
    this.localStoragePath = process.env.STORAGE_PATH || "./storage"
    if (this.useS3) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      })
    }
  }

  async uploadFile(
    userId: string,
    fileName: string,
    fileBuffer: Buffer,
    encrypt: boolean = true
  ): Promise<string> {
    const fileKey = `${fileName}-${userId}/${Date.now()}`
    if (this.useS3) {
      if (!encrypt) {
        await this.s3Client!.send(
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: this.getMimeType(fileName),
          })
        )
        return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`
      }
      const encryptedBuffer = Encryption.encryptBuffer(fileBuffer)
      await this.s3Client!.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: fileKey,
          Body: encryptedBuffer,
          ServerSideEncryption: "AES256",
        })
      )

      return `s3://${process.env.S3_BUCKET}/${fileKey}`
    } else {
      const filePath = path.join(this.localStoragePath, fileKey)

      if (encrypt) {
        const encryptedBuffer = Encryption.encryptBuffer(fileBuffer)
        await writeFile(filePath, encryptedBuffer)
      } else {
        await writeFile(filePath, fileBuffer)
      }

      return `file://${filePath}`
    }
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase()
    const mimeTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".gif": "image/gif",
    }
    return mimeTypes[ext] || "application/octet-stream"
  }
  async getFile(fileUrl: string): Promise<Buffer> {
    if (fileUrl.startsWith("s3://")) {
      const key = fileUrl.replace(`s3://${process.env.S3_BUCKET}/`, "")
      const response = await this.s3Client!.send(
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
        })
      )

      const encryptedBuffer = await this.streamToBuffer(response.Body)
      return Encryption.decryptBuffer(encryptedBuffer)
    } else {
      const key = fileUrl.replace("file://", "")
      const filePath = path.join(this.localStoragePath, key)
      const encryptedBuffer = await readFile(filePath)
      return Encryption.decryptBuffer(encryptedBuffer)
    }
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }
}
