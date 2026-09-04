// File ini isinya semua "obrolan" ke Gemini API.
// Dua fungsi utama:
// 1. validateApiKey  -> cek API key valid/nggak
// 2. analyzeVideo    -> minta Gemini nonton video YouTube + baca brief,
//                       lalu balikin daftar klip yang direkomendasikan

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function validateApiKey(apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    // Test super ringan, cuma minta balas 1 kata, biar hemat kuota
    const result = await model.generateContent('Balas dengan kata "OK" saja.');
    const text = result.response.text();
    return { valid: true, sample: text.trim() };
  } catch (err) {
    return { valid: false, error: err.message || 'API key tidak valid' };
  }
}

async function fetchBriefText(briefUrl) {
  // Ambil isi teks dari link brief campaign (Google Doc published-to-web,
  // Notion public page, atau halaman web biasa). Kita ambil teks mentahnya
  // saja lalu serahkan ke Gemini untuk dipahami.
  try {
    const res = await fetch(briefUrl, { redirect: 'follow' });
    const html = await res.text();
    // Strip tag HTML kasar-kasaran supaya Gemini fokus ke isi teks
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 15000); // batasi biar prompt tidak kebesaran
  } catch (err) {
    throw new Error('Gagal mengambil isi brief campaign dari link tersebut: ' + err.message);
  }
}

const ANALYZE_PROMPT = ({ briefText, numClips, captionStyleLabel }) => `
Kamu adalah AI video editor profesional yang ahli membuat klip pendek viral untuk TikTok/Reels/Shorts dari video panjang (podcast, wawancara, seminar, dsb).

TUGAS:
1. Tonton video YouTube ini dengan seksama, dari awal sampai akhir.
2. Baca BRIEF CAMPAIGN berikut ini dengan seksama. WAJIB patuhi semua aturan dan hindari semua larangan di dalamnya:
---BRIEF CAMPAIGN---
${briefText || '(Tidak ada brief campaign yang diberikan, gunakan penilaian umum tentang konten menarik & aman untuk semua audiens)'}
---END BRIEF---

3. Tentukan tepat ${numClips} momen/segmen paling menarik dan paling berpotensi viral di TikTok (hook kuat, emosional, kontroversial-tapi-aman, informatif-mengejutkan, atau lucu). Setiap klip idealnya 20-90 detik.
4. Untuk SETIAP klip, tentukan juga "framing plan": apakah sepanjang klip cukup fokus ke satu orang (mode "single"), atau ada momen dua orang harus ditampilkan sekaligus misal podcast 2 host (mode "split"). Framing plan dipecah jadi sub-segmen dengan waktu mulai/selesai relatif terhadap klip (bukan terhadap video penuh).
5. Buatkan caption/keterangan yang siap upload (gaya santai, ada hook di kalimat pertama) untuk tiap klip, dalam Bahasa Indonesia kecuali brief campaign meminta bahasa lain.
6. Buatkan maksimal 5 hashtag paling relevan per klip (selain hashtag wajib dari brief campaign jika ada), dan sebutkan nama akun/orang yang layak di-tag jika teridentifikasi di video/brief.
7. Berikan subtitle per klip dalam bentuk daftar baris dengan perkiraan waktu mulai & selesai tiap baris (untuk gaya caption "${captionStyleLabel}"), transkrip singkat sesuai ucapan di video.
8. Urutkan hasil dari klip dengan skor potensi viral TERTINGGI ke terendah, beri skor 0-100.

WAJIB balas HANYA dalam format JSON valid (tanpa markdown, tanpa penjelasan tambahan), dengan struktur persis seperti ini:

{
  "clips": [
    {
      "rank": 1,
      "viral_score": 92,
      "title": "Judul singkat klip",
      "start_time": "00:04:12",
      "end_time": "00:05:30",
      "reasoning": "Kenapa momen ini berpotensi viral, 1-2 kalimat",
      "framing_plan": [
        {"start": "00:00:00", "end": "00:00:20", "mode": "single", "focus": "center"},
        {"start": "00:00:20", "end": "00:00:35", "mode": "split", "focus": "both"}
      ],
      "caption": "Caption siap upload dengan hook di awal...",
      "hashtags": ["#contoh1", "#contoh2"],
      "tag_accounts": ["@contohakun"],
      "subtitles": [
        {"start": "00:00:00", "end": "00:00:02", "text": "Kata-kata yang diucapkan"}
      ]
    }
  ]
}

Waktu start_time/end_time HARUS relatif terhadap video YouTube penuh (format HH:MM:SS). Waktu di dalam framing_plan dan subtitles HARUS relatif terhadap klip itu sendiri (dimulai dari 00:00:00).
`;

async function analyzeVideo({ apiKey, youtubeUrl, briefUrl, numClips, captionStyleLabel }) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const briefText = briefUrl ? await fetchBriefText(briefUrl) : '';

  const prompt = ANALYZE_PROMPT({ briefText, numClips, captionStyleLabel });

  // Gemini mendukung video YouTube langsung via fileData.fileUri
  // untuk video PUBLIK/UNLISTED. Video privat butuh alur OAuth terpisah
  // (lihat catatan di README bagian "Batasan versi ini").
  const result = await model.generateContent([
    {
      fileData: {
        fileUri: youtubeUrl,
      },
    },
    { text: prompt },
  ]);

  const raw = result.response.text();
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error('Gemini membalas format tidak terduga, coba proses ulang. Detail: ' + err.message);
  }
  return parsed.clips || [];
}

module.exports = { validateApiKey, analyzeVideo, fetchBriefText };
