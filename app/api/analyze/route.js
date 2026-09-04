import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { analyzeVideo } from '../../../lib/gemini';
import { createJob, updateJob } from '../../../lib/jobStore';
import { CAPTION_STYLES } from '../../../lib/captionStyles';

export async function POST(req) {
  const { apiKey, youtubeUrl, briefUrl, numClips, captionEnabled, captionStyleId } = await req.json();

  if (!apiKey || !youtubeUrl) {
    return NextResponse.json({ error: 'API key dan URL YouTube wajib diisi' }, { status: 400 });
  }
  const clipCount = Math.min(15, Math.max(1, parseInt(numClips, 10) || 5));
  const styleLabel = CAPTION_STYLES[captionStyleId]?.label || 'Minimalis Aesthetic';

  const jobId = nanoid(10);
  createJob(jobId, {
    status: 'analyzing',
    message: 'Gemini sedang menonton video & membaca brief campaign...',
    youtubeUrl,
    captionEnabled,
    captionStyleId,
  });

  try {
    const clips = await analyzeVideo({
      apiKey,
      youtubeUrl,
      briefUrl,
      numClips: clipCount,
      captionStyleLabel: styleLabel,
    });

    updateJob(jobId, {
      status: 'analyzed',
      message: `Ditemukan ${clips.length} klip potensial. Siap diproses.`,
      clips,
    });

    return NextResponse.json({ jobId, clips });
  } catch (err) {
    updateJob(jobId, { status: 'error', error: err.message });
    return NextResponse.json({ error: 'Gagal menganalisis video: ' + err.message, jobId }, { status: 500 });
  }
}
