import { NextResponse } from 'next/server';

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function POST(req) {
  const { youtubeUrl } = await req.json();
  const videoId = extractVideoId(youtubeUrl || '');
  if (!videoId) {
    return NextResponse.json({ error: 'Link YouTube tidak dikenali. Pastikan formatnya seperti https://www.youtube.com/watch?v=... atau https://youtu.be/...' }, { status: 400 });
  }

  try {
    // oEmbed = cara resmi & ringan YouTube buat ambil judul + thumbnail
    // tanpa perlu API key. Hanya berfungsi untuk video PUBLIK/UNLISTED.
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) {
      return NextResponse.json({
        error: 'Video tidak ditemukan lewat oEmbed. Kemungkinan video ini PRIVAT — versi saat ini baru mendukung video publik/unlisted.',
      }, { status: 404 });
    }
    const data = await res.json();
    return NextResponse.json({
      videoId,
      title: data.title,
      author: data.author_name,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailMax: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Gagal mengambil info video: ' + err.message }, { status: 500 });
  }
}
