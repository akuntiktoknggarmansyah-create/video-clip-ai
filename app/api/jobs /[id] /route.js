import { NextResponse } from 'next/server';
import { getJob } from '../../../../lib/jobStore';

export async function GET(req, { params }) {
  const job = getJob(params.id);
  if (!job) {
    return NextResponse.json({ error: 'Job tidak ditemukan' }, { status: 404 });
  }
  // Jangan kirim path file sistem mentah ke browser demi keamanan, cukup index-nya
  const safeClips = (job.renderedClips || job.clips || []).map((c, i) => ({
    ...c,
    filePath: undefined,
    downloadUrl: job.renderedClips ? `/api/download/${job.id}/${i}` : null,
  }));

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    error: job.error,
    clips: safeClips,
  });
}
