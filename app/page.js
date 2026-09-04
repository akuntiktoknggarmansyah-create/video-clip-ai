'use client';

import { useState, useEffect, useRef } from 'react';

const CLIP_STYLES = [
  { id: 'blur_split', title: 'Blur Background + Auto Split Screen', desc: 'Layer belakang blur 9:16 penuh, orang di-zoom fokus. Otomatis jadi split screen kalau ada 2 orang tampil bareng.', available: true },
  { id: 'soon_2', title: 'Style #2', desc: 'Menyusul — kasih tahu gua deskripsinya kalau style #1 udah sesuai.', available: false },
  { id: 'soon_3', title: 'Style #3', desc: 'Menyusul', available: false },
  { id: 'soon_4', title: 'Style #4', desc: 'Menyusul', available: false },
  { id: 'soon_5', title: 'Style #5', desc: 'Menyusul', available: false },
];

const CAPTION_STYLES = [
  { id: 'hormozi', title: 'Alex Hormozi (Bold & Karaoke)', desc: 'Huruf besar tebal, kata yang diucapkan menyala kuning' },
  { id: 'minimalist', title: 'Minimalis Aesthetic', desc: 'Font tipis elegan, putih bersih, di tengah bawah' },
  { id: 'popup_emoji', title: 'Pop-Up dengan Emoji (MrBeast Style)', desc: 'Warna-warni, muncul per kata, ada emoji' },
  { id: 'handwritten', title: 'Handwritten / Casual', desc: 'Gaya tulisan tangan, santai' },
  { id: 'kinetic', title: 'Kinetic / Motion Text', desc: 'Teks bergerak dinamis mengikuti ritme bicara' },
];

const STEP_LABELS = ['API Key', 'Video', 'Brief', 'Style Clip', 'Caption', 'Jumlah', 'Proses'];

export default function Home() {
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState('wizard'); // wizard | processing | results

  // Step 1
  const [apiKey, setApiKey] = useState('');
  const [keyStatus, setKeyStatus] = useState(null); // null | 'checking' | 'valid' | 'invalid'
  const [keyError, setKeyError] = useState('');

  // Step 2
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');

  // Step 3
  const [briefUrl, setBriefUrl] = useState('');

  // Step 4
  const [clipStyle, setClipStyle] = useState('blur_split');

  // Step 5
  const [captionEnabled, setCaptionEnabled] = useState(true);
  const [captionStyleId, setCaptionStyleId] = useState('hormozi');

  // Step 6
  const [numClips, setNumClips] = useState(5);

  // Processing
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [jobMessage, setJobMessage] = useState('');
  const [jobProgress, setJobProgress] = useState(0);
  const [jobError, setJobError] = useState('');
  const [resultClips, setResultClips] = useState([]);
  const pollRef = useRef(null);

  async function checkApiKey() {
    setKeyStatus('checking');
    setKeyError('');
    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (data.valid) {
        setKeyStatus('valid');
      } else {
        setKeyStatus('invalid');
        setKeyError(data.error || 'API key tidak valid');
      }
    } catch (err) {
      setKeyStatus('invalid');
      setKeyError('Gagal menghubungi server: ' + err.message);
    }
  }

  async function checkVideo() {
    setVideoLoading(true);
    setVideoError('');
    setVideoInfo(null);
    try {
      const res = await fetch('/api/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVideoError(data.error || 'Gagal mengambil info video');
      } else {
        setVideoInfo(data);
      }
    } catch (err) {
      setVideoError('Gagal menghubungi server: ' + err.message);
    } finally {
      setVideoLoading(false);
    }
  }

  async function startAnalyze() {
    setPhase('processing');
    setJobStatus('analyzing');
    setJobMessage('Gemini sedang menonton video & membaca brief campaign... (bisa 1-3 menit tergantung durasi video)');
    setJobProgress(5);
    setJobError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey, youtubeUrl, briefUrl, numClips, captionEnabled, captionStyleId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJobStatus('error');
        setJobError(data.error || 'Gagal menganalisis video');
        return;
      }
      setJobId(data.jobId);
      await startProcess(data.jobId);
    } catch (err) {
      setJobStatus('error');
      setJobError('Gagal menghubungi server: ' + err.message);
    }
  }

  async function startProcess(id) {
    setJobStatus('rendering');
    setJobMessage('Memulai render klip...');
    await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: id }),
    });
    pollRef.current = setInterval(() => pollJob(id), 3000);
  }

  async function pollJob(id) {
    try {
      const res = await fetch(`/api/jobs/${id}`);
      const data = await res.json();
      setJobStatus(data.status);
      setJobMessage(data.message);
      setJobProgress(data.progress || 0);
      if (data.status === 'done') {
        clearInterval(pollRef.current);
        setResultClips(data.clips || []);
        setPhase('results');
      }
      if (data.status === 'error') {
        clearInterval(pollRef.current);
        setJobError(data.error || 'Terjadi kesalahan saat memproses');
      }
    } catch (err) {
      // biarin polling lanjut, mungkin cuma network sekejap
    }
  }

  useEffect(() => () => clearInterval(pollRef.current), []);

  function resetAll() {
    clearInterval(pollRef.current);
    setPhase('wizard');
    setStep(1);
    setJobId(null);
    setJobStatus(null);
    setResultClips([]);
  }

  if (phase === 'processing') {
    return (
      <div className="app">
        <Header />
        <div className="card">
          <p className="card-title">⚙️ Memproses video kamu</p>
          <p className="card-sub">Jangan tutup halaman ini dulu ya. Proses bisa makan waktu beberapa menit tergantung panjang video & jumlah klip.</p>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${jobProgress}%` }} /></div>
          <p className={`status-msg ${jobStatus === 'error' ? 'status-err' : 'status-info'}`}>
            {jobStatus === 'error' ? (jobError || 'Terjadi kesalahan') : jobMessage}
          </p>
          {jobStatus === 'error' && (
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={resetAll}>Ulangi dari awal</button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <div className="app">
        <Header />
        <div className="card">
          <p className="card-title">🎬 Klip kamu siap!</p>
          <p className="card-sub">Diurutkan dari yang paling berpotensi viral. Tinggal download & upload.</p>
        </div>
        {resultClips.map((clip, i) => (
          <div className="clip-card" key={i}>
            <div className="clip-rank">Rank #{clip.rank || i + 1}</div>
            <div className="clip-title">{clip.title}</div>
            <div className="clip-meta">
              <span className="score-pill">🔥 {clip.viral_score}/100</span>{' '}
              &middot; {clip.start_time} - {clip.end_time}
            </div>
            {clip.reasoning && <div className="hint" style={{ marginBottom: 8 }}>{clip.reasoning}</div>}
            <div className="clip-caption">{clip.caption}</div>
            <div className="hashtag-row">
              {(clip.hashtags || []).slice(0, 5).map((h, idx) => <span className="hashtag" key={idx}>{h}</span>)}
              {(clip.tag_accounts || []).map((t, idx) => <span className="hashtag" key={'t' + idx}>{t}</span>)}
            </div>
            {clip.downloadUrl ? (
              <a className="btn btn-primary" href={clip.downloadUrl} download>⬇ Download Klip</a>
            ) : (
              <button className="btn btn-secondary" disabled>Menyiapkan file...</button>
            )}
          </div>
        ))}
        <button className="btn btn-secondary" onClick={resetAll}>Proses video lain</button>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <Stepper step={step} />

      {step === 1 && (
        <div className="card">
          <p className="card-title"><span className="step-badge">1</span> Masukkan API Key Gemini</p>
          <p className="card-sub">Dipakai supaya AI bisa "menonton" video YouTube kamu secara seksama.</p>
          <label className="field-label">Gemini API Key</label>
          <input type="password" placeholder="AIza..." value={apiKey} onChange={(e) => { setApiKey(e.target.value); setKeyStatus(null); }} />
          <p className="hint">
            Belum punya API key? Ikuti tutorial: buka <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a> lewat browser HP → login akun Google → klik <b>"Create API Key"</b> → pilih/buat project → salin kode yang muncul (diawali <code>AIza...</code>) → tempel di kolom atas. Gratis untuk pemakaian wajar.
          </p>
          {keyStatus === 'valid' && <p className="status-msg status-ok">✓ API key valid dan siap dipakai</p>}
          {keyStatus === 'invalid' && <p className="status-msg status-err">✗ {keyError}</p>}
          <div className="btn-row">
            <button className="btn btn-primary" disabled={!apiKey || keyStatus === 'checking'} onClick={checkApiKey}>
              {keyStatus === 'checking' ? 'Mengecek...' : 'Cek API Key'}
            </button>
          </div>
          {keyStatus === 'valid' && (
            <div className="btn-row"><button className="btn btn-primary" onClick={() => setStep(2)}>Lanjut →</button></div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <p className="card-title"><span className="step-badge">2</span> Link Video YouTube</p>
          <p className="card-sub">Pastikan thumbnail muncul di bawah supaya kamu yakin ini video yang benar. Versi saat ini mendukung video publik/unlisted.</p>
          <label className="field-label">URL Video YouTube</label>
          <input type="url" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => { setYoutubeUrl(e.target.value); setVideoInfo(null); }} />
          <div className="btn-row">
            <button className="btn btn-secondary" disabled={!youtubeUrl || videoLoading} onClick={checkVideo}>
              {videoLoading ? 'Memuat...' : 'Cek Video'}
            </button>
          </div>
          {videoError && <p className="status-msg status-err">✗ {videoError}</p>}
          {videoInfo && (
            <div className="thumb-wrap">
              <img src={videoInfo.thumbnail} alt="thumbnail" />
              <div className="thumb-caption"><b>{videoInfo.title}</b><br />oleh {videoInfo.author}</div>
            </div>
          )}
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Kembali</button>
            <button className="btn btn-primary" disabled={!videoInfo} onClick={() => setStep(3)}>Lanjut →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <p className="card-title"><span className="step-badge">3</span> Link Brief Campaign</p>
          <p className="card-sub">AI akan membaca ini dengan seksama sebelum ngeklip, supaya hasil klip sesuai aturan & menghindari larangan di brief. Boleh dikosongkan kalau tidak ada.</p>
          <label className="field-label">URL Brief Campaign (Google Doc/Notion/halaman web)</label>
          <input type="url" placeholder="https://docs.google.com/... (opsional)" value={briefUrl} onChange={(e) => setBriefUrl(e.target.value)} />
          <p className="hint">Tips: kalau pakai Google Docs, klik "Bagikan" → "Siapa saja yang memiliki link" supaya bisa dibaca AI.</p>
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep(2)}>← Kembali</button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Lanjut →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <p className="card-title"><span className="step-badge">4</span> Style Clipping Video</p>
          <p className="card-sub">Pilih gaya visual untuk klip kamu.</p>
          <div className="style-grid">
            {CLIP_STYLES.map((s) => (
              <div
                key={s.id}
                className={`style-option ${clipStyle === s.id ? 'selected' : ''} ${!s.available ? 'disabled' : ''}`}
                onClick={() => s.available && setClipStyle(s.id)}
              >
                <div className="style-option-title">{s.title}{!s.available && <span className="badge-soon">Segera</span>}</div>
                <div className="style-option-desc">{s.desc}</div>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep(3)}>← Kembali</button>
            <button className="btn btn-primary" onClick={() => setStep(5)}>Lanjut →</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="card">
          <p className="card-title"><span className="step-badge">5</span> Auto Caption</p>
          <div className="toggle-row">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Aktifkan subtitle otomatis</div>
              <div className="hint">Teks ucapan otomatis muncul di video klip</div>
            </div>
            <div className={`switch ${captionEnabled ? 'on' : ''}`} onClick={() => setCaptionEnabled(!captionEnabled)}>
              <div className="knob" />
            </div>
          </div>
          {captionEnabled && (
            <>
              <p className="card-sub" style={{ marginTop: 16 }}>Pilih gaya subtitle:</p>
              <div className="style-grid">
                {CAPTION_STYLES.map((s) => (
                  <div key={s.id} className={`style-option ${captionStyleId === s.id ? 'selected' : ''}`} onClick={() => setCaptionStyleId(s.id)}>
                    <div className="style-option-title">{s.title}</div>
                    <div className="style-option-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep(4)}>← Kembali</button>
            <button className="btn btn-primary" onClick={() => setStep(6)}>Lanjut →</button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="card">
          <p className="card-title"><span className="step-badge">6</span> Jumlah Klip</p>
          <p className="card-sub">Berapa klip yang mau di-generate dari video ini?</p>
          <div className="slider-row">
            <input type="range" min="1" max="15" value={numClips} onChange={(e) => setNumClips(Number(e.target.value))} />
            <div className="slider-value">{numClips}</div>
          </div>
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep(5)}>← Kembali</button>
            <button className="btn btn-primary" onClick={() => setStep(7)}>Lanjut →</button>
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="card">
          <p className="card-title"><span className="step-badge">7</span> Ringkasan & Proses</p>
          <SummaryRow label="Video" value={videoInfo?.title} />
          <SummaryRow label="Brief campaign" value={briefUrl || '(tidak ada)'} />
          <SummaryRow label="Style clip" value={CLIP_STYLES.find((s) => s.id === clipStyle)?.title} />
          <SummaryRow label="Caption" value={captionEnabled ? CAPTION_STYLES.find((s) => s.id === captionStyleId)?.title : 'Nonaktif'} />
          <SummaryRow label="Jumlah klip" value={numClips} />
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep(6)}>← Kembali</button>
            <button className="btn btn-primary" onClick={startAnalyze}>🚀 Proses Sekarang</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="header">
      <div className="logo-dot" />
      <div className="brand">ClipAI</div>
    </div>
  );
}

function Stepper({ step }) {
  return (
    <div className="stepper">
      {STEP_LABELS.map((_, i) => (
        <div key={i} className={`dot ${i + 1 < step ? 'done' : ''} ${i + 1 === step ? 'active' : ''}`} />
      ))}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span style={{ textAlign: 'right', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
