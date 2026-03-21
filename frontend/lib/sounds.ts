// Synthesized sounds via Web Audio API — no external files needed

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playCardDeal() {
  const c = getCtx();
  if (!c) return;
  const duration = 0.07;
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.22));
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const hpf = c.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 1300;
  const gain = c.createGain();
  gain.gain.value = 0.3;
  src.connect(hpf);
  hpf.connect(gain);
  gain.connect(c.destination);
  src.start();
}

export function playChip() {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.09);
  gain.gain.setValueAtTime(0.22, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.1);
}
