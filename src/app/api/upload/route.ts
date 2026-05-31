import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let fileBuffer: Buffer;
    let fileName: string;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    if (contentType.includes('application/json')) {
      const { image, prefix } = await req.json();

      if (!image || !image.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Invalid base64 image format' }, { status: 400 });
      }

      // Extract format and data
      const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: 'Could not parse base64 image' }, { status: 400 });
      }

      const ext = matches[1];
      const dataStr = matches[2];
      fileBuffer = Buffer.from(dataStr, 'base64');
      
      const filePrefix = prefix || 'img';
      fileName = `${filePrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const prefix = formData.get('prefix') as string || 'photo';

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      
      const originalExt = path.extname(file.name) || '.png';
      fileName = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}${originalExt}`;
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
    }

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, fileBuffer);

    // Return the relative URL to access the uploaded file
    const url = `/uploads/${fileName}`;
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 });
  }
}
