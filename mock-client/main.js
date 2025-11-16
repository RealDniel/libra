const el = {
  backendUrl: document.getElementById('backendUrl'),
  audioFile: document.getElementById('audioFile'),
  sendBtn: document.getElementById('sendBtn'),
  uploadStatus: document.getElementById('uploadStatus'),
  transcript: document.getElementById('transcript'),
  log: document.getElementById('log'),
  recordBtn: document.getElementById('recordBtn'),
  stopBtn: document.getElementById('stopBtn'),
  recStatus: document.getElementById('recStatus'),
  preview: document.getElementById('preview'),
  sendRecordedBtn: document.getElementById('sendRecordedBtn'),
};

function log(message) {
  const timestamp = new Date().toISOString();
  el.log.textContent += `[${timestamp}] ${message}\n`;
}

async function uploadBlobAsAudio(blob, filename, mimeType) {
  const url = el.backendUrl.value.trim();
  if (!url) {
    alert('Please enter backend URL');
    return;
  }
  const form = new FormData();
  form.append('audio', new File([blob], filename, { type: mimeType }));

  el.uploadStatus.textContent = 'uploading...';
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: form,
    });
    const text = await res.text();
    log(`HTTP ${res.status}: ${text}`);
    if (!res.ok) {
      el.uploadStatus.textContent = 'error';
      try {
        const json = JSON.parse(text);
        el.transcript.textContent = json.error || 'Upload failed';
      } catch {
        el.transcript.textContent = 'Upload failed';
      }
      return;
    }
    const data = JSON.parse(text);
    el.transcript.textContent = data.transcript || '(no transcript)';
    el.uploadStatus.textContent = 'done';
  } catch (err) {
    log(`Fetch error: ${err}`);
    el.uploadStatus.textContent = 'error';
    el.transcript.textContent = 'Network error';
  }
}

// File upload flow
el.sendBtn.addEventListener('click', async () => {
  const file = el.audioFile.files?.[0];
  if (!file) {
    alert('Select an audio file first');
    return;
  }
  log(`Uploading file: ${file.name} (${file.type || 'unknown mimetype'})`);
  await uploadBlobAsAudio(file, file.name, file.type || 'application/octet-stream');
});

// Recording flow (MediaRecorder)
let mediaRecorder = null;
let recordedChunks = [];

el.recordBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      el.preview.src = url;
      el.sendRecordedBtn.disabled = false;
      log(`Recorded ${blob.size} bytes as audio/webm`);
    };
  
    mediaRecorder.start();
    el.recStatus.textContent = 'recording...';
    el.recordBtn.disabled = true;
    el.stopBtn.disabled = false;
    el.sendRecordedBtn.disabled = true;
    log('Recording started');
  } catch (err) {
    log(`Mic error: ${err}`);
    alert('Microphone permission denied or unavailable.');
  }
});

el.stopBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    el.recStatus.textContent = 'stopped';
    el.recordBtn.disabled = false;
    el.stopBtn.disabled = true;
    log('Recording stopped');
  }
});

el.sendRecordedBtn.addEventListener('click', async () => {
  if (!recordedChunks.length) {
    alert('No recording to send.');
    return;
  }
  const blob = new Blob(recordedChunks, { type: 'audio/webm' });
  await uploadBlobAsAudio(blob, 'recording.webm', 'audio/webm');
});


