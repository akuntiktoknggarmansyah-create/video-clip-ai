// Ini "dapur" tempat video beneran dipotong & didandani.
// Alurnya per klip:
//   1. Potong segmen dari video sumber (sesuai start_time/end_time dari Gemini)
//   2. Pecah jadi sub-segmen sesuai framing_plan (single vs split)
//   3. Render tiap sub-segmen: single -> blur background 9:16 + zoom fokus orang
//                              split  -> dua kotak berdampingan
//   4. Gabung (concat) semua sub-segmen jadi satu file klip utuh
//   5. Bikin file subtitle .ass sesuai style yang dipilih, lalu "bakar" ke video

const path = require('path');
const fs = require('fs');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('@distube/ytdl-core');
const { CAPTION_STYLES } = require('./captionStyles');

const TMP_ROOT = path.join(os.tmpdir(), 'video-clip-ai');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
  return p;
}

// --- Helper waktu ---
function hmsToSeconds(hms) {
  const parts = hms.split(':').map(Number);
  while (parts.length < 3) parts.unshift(0);
  const [h, m, s] = parts;
  return h * 3600 + m * 60 + s;
}

// --- 1. Download video sumber sekali saja per job ---
function downloadSourceVideo(youtubeUrl, jobId) {
  return new Promise((resolve, reject) => {
    const dir = ensureDir(path.join(TMP_ROOT, jobId));
    const outPath = path.join(dir, 'source.mp4');
    const stream = ytdl(youtubeUrl, {
      quality: 'highest',
      filter: (format) => format.container === 'mp4' && format.hasVideo && format.hasAudio,
    });
    const writeStream = fs.createWriteStream(outPath);
    stream.pipe(writeStream);
    stream.on('error', reject);
    writeStream.on('finish', () => resolve(outPath));
    writeStream.on('error', reject);
  });
}

// --- 2. Potong satu segmen mentah dari source ---
function cutSegment(sourcePath, start, duration, outPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(sourcePath)
      .setStartTime(start)
      .duration(duration)
      .outputOptions(['-c:v libx264', '-c:a aac', '-avoid_negative_ts make_zero'])
      .save(outPath)
      .on('end', () => resolve(outPath))
      .on('error', reject);
  });
}

// --- 3a. Render mode "single": blur background full 9:16 + foreground di-zoom ---
// Layer belakang: video di-scale penuh ke 1080x1920 lalu di-blur (background)
// Layer depan: video yang sama di-zoom (crop tengah) supaya orang jadi fokus,
//              ditumpuk di tengah layer belakang.
function buildSingleFilter() {
  return [
    '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=25[bg]',
    '[0:v]scale=1080:-1,crop=in_w:in_w*16/9[fg]',
    '[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]',
  ].join(';');
}

// --- 3b. Render mode "split": dua kotak berdampingan (atas-bawah, biar natural di 9:16) ---
// Catatan MVP: karena kita cuma punya 1 track video (bukan 2 kamera terpisah),
// belah dua FRAME yang sama jadi sisi kiri & kanan gambar sebagai pendekatan awal.
// Kalau video sumbernya sudah split-screen bawaan (podcast dgn 2 kamera dalam 1 frame),
// hasilnya akan otomatis rapi. Kalau belum, ini titik yang paling worth di-upgrade
// belakangan pakai deteksi wajah (lihat README > "Roadmap Upgrade").
function buildSplitFilter() {
  return [
    '[0:v]crop=iw/2:ih:0:0,scale=1080:960[left]',
    '[0:v]crop=iw/2:ih:iw/2:0,scale=1080:960[right]',
    '[left][right]vstack=inputs=2[outv]',
  ].join(';');
}

function renderSubSegment({ inputPath, mode, outPath }) {
  return new Promise((resolve, reject) => {
    const filter = mode === 'split' ? buildSplitFilter() : buildSingleFilter();
    ffmpeg(inputPath)
      .complexFilter(filter)
      .outputOptions(['-map [outv]', '-map 0:a?', '-c:v libx264', '-c:a aac', '-r 30'])
      .save(outPath)
      .on('end', () => resolve(outPath))
      .on('error', reject);
  });
}

// --- 4. Gabung beberapa sub-segmen jadi satu file ---
function concatSegments(segmentPaths, outPath) {
  return new Promise((resolve, reject) => {
    const listFile = outPath + '.txt';
    fs.writeFileSync(listFile, segmentPaths.map((p) => `file '${p}'`).join('\n'));
    ffmpeg()
      .input(listFile)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .save(outPath)
      .on('end', () => resolve(outPath))
      .on('error', reject);
  });
}

// --- 5a. Bikin file .ass dari data subtitles + style pilihan ---
function buildAssFile({ subtitles, styleId, outPath }) {
  const style = CAPTION_STYLES[styleId] || CAPTION_STYLES.minimalist;
  let body = style.header;

  subtitles.forEach((line) => {
    let text = style.uppercase ? line.text.toUpperCase() : line.text;

    if (style.karaoke) {
      // Sebar durasi baris rata ke tiap kata pakai tag \k (karaoke, satuan centisecond)
      const words = text.split(' ').filter(Boolean);
      const dur = hmsToSeconds(line.end) - hmsToSeconds(line.start);
      const perWordCs = Math.max(10, Math.round((dur / Math.max(words.length, 1)) * 100));
      text = words.map((w) => `{\\k${perWordCs}}${w}`).join(' ');
    }

    const startAss = toAssTime(line.start);
    const endAss = toAssTime(line.end);
    body += `Dialogue: 0,${startAss},${endAss},${style.styleName},,0,0,0,,${text}\n`;
  });

  fs.writeFileSync(outPath, body, 'utf-8');
  return outPath;
}

function toAssTime(hms) {
  const totalSec = hmsToSeconds(hms);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const cs = Math.round((totalSec - Math.floor(totalSec)) * 100);
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`;
}

// --- 5b. Bakar subtitle ke video final ---
function burnSubtitles(inputPath, assPath, outPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([`-vf subtitles=${assPath.replace(/:/g, '\\:')}`, '-c:a copy'])
      .save(outPath)
      .on('end', () => resolve(outPath))
      .on('error', reject);
  });
}

// --- Orkestrasi 1 klip penuh, dipanggil dari API route /process ---
async function renderClip({ jobId, sourcePath, clip, captionEnabled, captionStyleId, index }) {
  const dir = ensureDir(path.join(TMP_ROOT, jobId, `clip-${index}`));
  const start = hmsToSeconds(clip.start_time);
  const end = hmsToSeconds(clip.end_time);
  const duration = Math.max(1, end - start);

  const rawSegment = path.join(dir, 'raw.mp4');
  await cutSegment(sourcePath, start, duration, rawSegment);

  const framingPlan = clip.framing_plan && clip.framing_plan.length
    ? clip.framing_plan
    : [{ start: '00:00:00', end: clip.end_time, mode: 'single' }];

  const subPaths = [];
  for (let i = 0; i < framingPlan.length; i++) {
    const seg = framingPlan[i];
    const segStart = hmsToSeconds(seg.start);
    const segDur = hmsToSeconds(seg.end) - segStart;
    const trimmed = path.join(dir, `seg-${i}-trim.mp4`);
    await cutSegment(rawSegment, segStart, segDur, trimmed);
    const rendered = path.join(dir, `seg-${i}-rendered.mp4`);
    await renderSubSegment({ inputPath: trimmed, mode: seg.mode, outPath: rendered });
    subPaths.push(rendered);
  }

  const combined = path.join(dir, 'combined.mp4');
  if (subPaths.length > 1) {
    await concatSegments(subPaths, combined);
  } else {
    fs.copyFileSync(subPaths[0], combined);
  }

  let finalPath = combined;
  if (captionEnabled && clip.subtitles && clip.subtitles.length) {
    const assPath = path.join(dir, 'captions.ass');
    buildAssFile({ subtitles: clip.subtitles, styleId: captionStyleId, outPath: assPath });
    const withCaptions = path.join(dir, 'final.mp4');
    await burnSubtitles(combined, assPath, withCaptions);
    finalPath = withCaptions;
  }

  return finalPath;
}

module.exports = {
  TMP_ROOT,
  ensureDir,
  downloadSourceVideo,
  renderClip,
};
