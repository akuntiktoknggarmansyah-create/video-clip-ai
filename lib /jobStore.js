// Penyimpanan status pekerjaan (job) secara sederhana di memori server.
// Cukup untuk MVP / pemakaian personal. Kalau nanti mau banyak user
// sekaligus secara serius, ini sebaiknya diganti database (misal Redis).

const jobs = new Map();

function createJob(id, data) {
  jobs.set(id, {
    id,
    status: 'pending', // pending -> analyzing -> rendering -> done -> error
    progress: 0,
    message: 'Menunggu diproses...',
    clips: [],
    error: null,
    createdAt: Date.now(),
    ...data,
  });
  return jobs.get(id);
}

function getJob(id) {
  return jobs.get(id) || null;
}

function updateJob(id, patch) {
  const job = jobs.get(id);
  if (!job) return null;
  Object.assign(job, patch);
  jobs.set(id, job);
  return job;
}

module.exports = { createJob, getJob, updateJob };
