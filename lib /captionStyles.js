// File ini isinya "resep tampilan" buat 5 gaya subtitle.
// Format ASS dipilih karena ffmpeg bisa render font besar, warna,
// outline tebal, dan animasi karaoke langsung tanpa alat tambahan.

// PlayResX/PlayResY = 1080x1920 karena semua klip output 9:16 (portrait).

const HEADER = (styleLine) => `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleLine}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

// Warna ASS pakai format &HAABBGGRR (kebalikan dari HEX biasa)
const CAPTION_STYLES = {
  hormozi: {
    id: 'hormozi',
    label: 'Alex Hormozi (Bold & Karaoke)',
    description: 'Huruf besar tebal kuning-putih, kata yang lagi diucapkan menyala',
    styleName: 'Hormozi',
    // Kuning terang untuk highlight kata aktif, putih untuk teks biasa, outline hitam tebal
    header: HEADER('Style: Hormozi,Liberation Sans,90,&H00FFFFFF,&H0000D7FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,8,4,2,60,60,180,1'),
    // dipakai saat generate: kata aktif dibungkus \c&H0000D7FF& (kuning) dan di-scale up dikit
    activeColor: '&H0000D7FF&',
    idleColor: '&H00FFFFFF&',
    karaoke: true,
    uppercase: true,
  },
  minimalist: {
    id: 'minimalist',
    label: 'Minimalis Aesthetic',
    description: 'Font tipis elegan, putih bersih, tanpa outline mencolok, posisi tengah bawah',
    styleName: 'Minimalist',
    header: HEADER('Style: Minimalist,Liberation Sans,58,&H00FFFFFF,&H000000FF,&H00404040,&H60000000,0,0,0,0,100,100,1,0,1,1,0,2,80,80,140,1'),
    karaoke: false,
    uppercase: false,
  },
  popup_emoji: {
    id: 'popup_emoji',
    label: 'Pop-Up dengan Emoji (MrBeast Style)',
    description: 'Huruf besar warna-warni bergantian, muncul kata per kata dengan emoji relevan',
    styleName: 'PopupEmoji',
    header: HEADER('Style: PopupEmoji,Liberation Sans,88,&H0000FFFF,&H00FF00FF,&H00000000,&H00000000,1,0,0,0,105,105,0,0,1,7,3,2,50,50,200,1'),
    karaoke: false,
    uppercase: true,
    emoji: true,
    // beberapa warna dirotasi per kata biar mirip gaya MrBeast
    colorCycle: ['&H0000FFFF&', '&H0000FF00&', '&H00FF66FF&', '&H0000A5FF&'],
  },
  handwritten: {
    id: 'handwritten',
    label: 'Handwritten / Casual',
    description: 'Font seperti tulisan tangan, warna putih/krem hangat, santai',
    styleName: 'Handwritten',
    // Catatan: font handwritten custom perlu di-upload ke folder /fonts (lihat README),
    // fallback ke Liberation Sans Italic kalau font belum ada
    header: HEADER('Style: Handwritten,Liberation Sans,70,&H00E6F0FF,&H0000A5FF,&H00202020,&H00000000,0,1,0,0,100,100,0,-3,1,3,1,2,70,70,160,1'),
    karaoke: false,
    uppercase: false,
    italic: true,
  },
  kinetic: {
    id: 'kinetic',
    label: 'Kinetic / Motion Text',
    description: 'Teks bergerak dinamis mengikuti ritme bicara, ukuran berubah-ubah',
    styleName: 'Kinetic',
    header: HEADER('Style: Kinetic,Liberation Sans,80,&H00FFFFFF,&H0000D7FF,&H00101010,&H00000000,1,0,0,0,100,100,0,0,1,6,2,2,50,50,180,1'),
    karaoke: false,
    uppercase: true,
    motion: true, // per baris di-random-in kecil pakai tag \move / \fscx animasi
  },
};

module.exports = { CAPTION_STYLES };
