import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  // Security: In a real app, you'd want to restrict this to specific directories
  // For this local demo, we'll allow reading files if they exist
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const extension = path.extname(filePath).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (extension === '.png') contentType = 'image/png';
    if (extension === '.jpg' || extension === '.jpeg') contentType = 'image/jpeg';
    if (extension === '.zip') contentType = 'application/zip';
    if (extension === '.json') contentType = 'application/json';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        // For traces, we might want to suggest a filename if downloaded
        'Content-Disposition': extension === '.zip' ? `attachment; filename="${path.basename(filePath)}"` : 'inline',
      },
    });
  } catch (error) {
    console.error('Error serving artifact:', error);
    return NextResponse.json({ error: 'Failed to serve artifact' }, { status: 500 });
  }
}
