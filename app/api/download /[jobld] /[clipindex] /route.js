import { NextResponse } from 'next/server';
import fs from 'fs';
import { getJob } from '../../../../../lib/jobStore';

export async function GET(req, { params }) {
  const job = getJob(params.jobId);
  if (!job || !job.renderedClips) {
    return NextResponse.json({ error: 'Klip belum siap' }, { status: 404 });
  }
  const clip = job.renderedClips[parseInt(params.clipIndex, 10)];
  if (!clip || !fs.existsSync(clip.filePath)) {
    return NextResponse.json({ error: 'File klip tidak ditemukan' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(clip.filePath);
  const safeTitle = (clip.title || 'clip').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${safeTitle}.mp4"`,
    },
  });
}
