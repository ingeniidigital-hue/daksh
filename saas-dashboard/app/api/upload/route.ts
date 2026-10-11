import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const titleId = formData.get("titleId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!titleId) {
      return NextResponse.json({ error: "No titleId provided for multi-tenant isolation" }, { status: 400 });
    }

    // Server-side validation: Max 5MB
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 413 });
    }

    // Only allow images
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename to prevent collisions
    const ext = path.extname(file.name) || ".png";
    const filename = `${crypto.randomUUID()}${ext}`;
    
    // Multi-tenant path isolation: e.g. "candy-crush/123e4567.png"
    const storageKey = `${titleId}/${filename}`;
    
    let fileUrl = "";

    // Check if we are configured to use cloud storage
    if (process.env.STORAGE_PROVIDER === "s3") {
      // TODO: Implement actual S3 Upload here when deploying to cloud
      /*
      import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
      const s3 = new S3Client({ region: process.env.AWS_REGION! });
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: storageKey,
        Body: buffer,
        ContentType: file.type,
      }));
      fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${storageKey}`;
      */
      throw new Error("S3 Upload provider configured but not fully implemented.");
    } else {
      // Fallback: Save to local public/uploads/{titleId} (for development)
      const uploadDir = path.join(process.cwd(), "public", "uploads", titleId);
      await mkdir(uploadDir, { recursive: true }); // Ensure tenant directory exists
      
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      fileUrl = `/uploads/${titleId}/${filename}`;
    }
    
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
