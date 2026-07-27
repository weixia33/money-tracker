// 音效管理 — 使用 Web Audio API 生成可爱提示音
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

// 确保 AudioContext 在用户交互后恢复
function ensureResumed() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15
) {
  ensureResumed();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// 记账成功 — 可爱的上升音阶 ✨
export function playSuccessSound() {
  playTone(523, 0.1, 'sine', 0.12); // C5
  setTimeout(() => playTone(659, 0.1, 'sine', 0.12), 80); // E5
  setTimeout(() => playTone(784, 0.18, 'sine', 0.12), 160); // G5
}

// 删除 — 柔和下降音
export function playDeleteSound() {
  playTone(523, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(392, 0.15, 'sine', 0.08), 70);
}

// 点击分类 — 轻快短音
export function playClickSound() {
  playTone(880, 0.06, 'sine', 0.08);
}

// 切换 tab — 柔和水滴音
export function playTabSound() {
  playTone(1047, 0.05, 'sine', 0.06);
}

// 切换 scope — 清脆切换音
export function playSwitchSound() {
  playTone(660, 0.04, 'triangle', 0.06);
  setTimeout(() => playTone(880, 0.06, 'triangle', 0.06), 40);
}

// 添加账户/分类 — 确认音
export function playAddSound() {
  playTone(587, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(880, 0.12, 'sine', 0.1), 80);
}
