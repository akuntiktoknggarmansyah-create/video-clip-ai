import { NextResponse } from 'next/server';
import { getJob, updateJob } from '../../../lib/jobStore';
import { downloadSourceVideo, renderClip } from '../../../lib/ffmpegProcessor';

export async function POST(req) {
  const { jobId } = await req.json();
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job tidak ditemukan. Ulangi dari tahap analisis.' }, { status: 404 });
  }

  // Kita balas duluan ke browser supaya tidak timeout, lalu lanjut proses
  // di background. Progress dipantau lewat GET /api/jobs/:id (polling).
  processInBackground(jobId).catch((err) => {
    updateJob(jobId, { status: 'error', error: err.message });
  });

  return NextResponse.json({ started: true, jobId });
}

async function processInBackground(jobId) {
  const job = getJob(jobId);
  updateJob(jobId, { status: 'downloading', message: 'Mengunduh video sumber dari YouTube...', progress: 5 });

  const sourcePath = await downloadSourceVideo(job.youtubeUrl, jobId);

  updateJob(jobId, { status: 'rendering', message: 'Merender klip 1...', progress: 10 });

  const total = job.clips.length;
  const renderedClips = [];

  for (let i = 0; i < total; i++) {
    const clip = job.clips[i];
    updateJob(jobId, {
      message: `Merender klip ${i + 1} dari ${total}: "${clip.title}"`,
      progress: 10 + Math.round((i / total) * 85),
    });

    const finalPath = await renderClip({
      jobId,
      sourcePath,
      clip,
      captionEnabled: job.captionEnabled,
      captionStyleId: job.captionStyleId,
      index: i,
    });

    renderedClips.push({ ...clip, filePath: finalPath, index: i });
  }

  updateJob(jobId, {
    status: 'done',
    message: 'Semua klip selesai diproses!',
    progress: 100,
    renderedClips,
  });
}
