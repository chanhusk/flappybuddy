/**
 * FLAPPY RYAN — Modern Mobile-Friendly Arcade Game
 */

(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // UI Elements
  const hudBest = document.getElementById('hudBest');
  const liveScoreContainer = document.getElementById('liveScoreContainer');
  const liveScoreEl = document.getElementById('liveScore');
  const milestoneToast = document.getElementById('milestoneToast');
  const startOverlay = document.getElementById('startOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const countdownOverlay = document.getElementById('countdownOverlay');
  const countdownNumber = document.getElementById('countdownNumber');

  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
  const retryBtn = document.getElementById('retryBtn');
  const shareBtn = document.getElementById('shareBtn');
  const shareFeedback = document.getElementById('shareFeedback');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const styleToggleBtn = document.getElementById('styleToggleBtn');
  const heroRyanImg = document.getElementById('heroRyanImg');
  const finalScoreEl = document.getElementById('finalScore');
  const finalBestEl = document.getElementById('finalBest');
  const newRecordBadge = document.getElementById('newRecordBadge');
  const medalCircle = document.getElementById('medalCircle');
  const medalBadge = document.getElementById('medalBadge');
  const medalName = document.getElementById('medalName');
  const gameOverTitle = document.getElementById('gameOverTitle');
  const gameOverQuip = document.getElementById('gameOverQuip');

  const modeButtons = document.querySelectorAll('.mode-btn');
  const themeButtons = document.querySelectorAll('.theme-btn');
  const styleButtons = document.querySelectorAll('.style-btn');

  // Load Ryan's images
  const ryanCutoutImg = new Image();
  ryanCutoutImg.src = 'assets/ryan-cutout.png';

  const ryanFullImg = new Image();
  ryanFullImg.src = 'assets/ryan-hires.png';
  ryanFullImg.onerror = () => {
    ryanFullImg.src = 'assets/ryan.png';
  };

  // Persistent Settings & High Score (safe for private browsing / in-app webviews)
  const STORAGE_KEYS = {
    best: 'flappy_ryan_best_v1',
    sound: 'flappy_ryan_sound_v1',
    style: 'flappy_ryan_style_v1',
    theme: 'flappy_ryan_theme_v1',
  };

  function safeGet(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeSet(key, val) {
    try {
      localStorage.setItem(key, String(val));
    } catch (_) {}
  }

  let bestScore = parseInt(safeGet(STORAGE_KEYS.best, '0'), 10) || 0;
  let soundEnabled = safeGet(STORAGE_KEYS.sound, 'true') !== 'false';
  let avatarStyle = safeGet(STORAGE_KEYS.style, 'cutout'); // 'cutout' | 'badge'
  let currentThemeIndex = parseInt(safeGet(STORAGE_KEYS.theme, '0'), 10) || 0;

  // Sky / Environment Themes
  const THEMES = [
    {
      name: 'Sunset Cruise',
      icon: '🌅',
      skyTop: '#0f172a',
      skyMid: '#3b1d5e',
      skyBot: '#f97316',
      sunColor: '#fde047',
      sunGlow: 'rgba(251, 191, 36, 0.35)',
      cloudColor: 'rgba(254, 215, 170, 0.22)',
      farHill: '#1e1b4b',
      nearHill: '#311042',
      cityColor: '#130924',
      windowColor: '#fbbf24',
      groundTop: '#10b981',
      groundStripe: '#34d399',
      groundDirt: '#1e293b',
      pipeBodyA: '#059669',
      pipeBodyB: '#34d399',
      pipeBodyC: '#047857',
      pipeBorder: '#064e3b',
    },
    {
      name: 'Bluebird Day',
      icon: '🌤️',
      skyTop: '#0284c7',
      skyMid: '#38bdf8',
      skyBot: '#bae6fd',
      sunColor: '#fef08a',
      sunGlow: 'rgba(254, 240, 138, 0.45)',
      cloudColor: 'rgba(255, 255, 255, 0.65)',
      farHill: '#0369a1',
      nearHill: '#075985',
      cityColor: '#0c4a6e',
      windowColor: '#e0f2fe',
      groundTop: '#22c55e',
      groundStripe: '#4ade80',
      groundDirt: '#334155',
      pipeBodyA: '#16a34a',
      pipeBodyB: '#4ade80',
      pipeBodyC: '#15803d',
      pipeBorder: '#14532d',
    },
    {
      name: 'Neon Night',
      icon: '🌃',
      skyTop: '#030712',
      skyMid: '#0f172a',
      skyBot: '#1e1b4b',
      sunColor: '#e2e8f0',
      sunGlow: 'rgba(56, 189, 248, 0.25)',
      cloudColor: 'rgba(56, 189, 248, 0.12)',
      farHill: '#090d1f',
      nearHill: '#111827',
      cityColor: '#030712',
      windowColor: '#38bdf8',
      groundTop: '#06b6d4',
      groundStripe: '#22d3ee',
      groundDirt: '#090d16',
      pipeBodyA: '#4f46e5',
      pipeBodyB: '#818cf8',
      pipeBodyC: '#3730a3',
      pipeBorder: '#1e1b4b',
    },
  ];

  // Difficulty Presets (Normalized to 60 FPS step)
  const DIFFICULTIES = {
    chill: {
      gravity: 0.36,
      jumpVelocity: -7.6,
      pipeSpeed: 2.65,
      pipeGap: 176,
      pipeInterval: 102,
      maxFallSpeed: 8.5,
    },
    classic: {
      gravity: 0.42,
      jumpVelocity: -8.2,
      pipeSpeed: 3.1,
      pipeGap: 152,
      pipeInterval: 88,
      maxFallSpeed: 9.8,
    },
    turbo: {
      gravity: 0.49,
      jumpVelocity: -8.9,
      pipeSpeed: 3.85,
      pipeGap: 138,
      pipeInterval: 74,
      maxFallSpeed: 11.2,
    },
  };

  let currentDifficulty = 'classic';

  // Web Audio Synthesizer (Zero external audio files required)
  class SoundFX {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    flap() {
      if (!soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(310, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.09);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    }

    tick(isGo = false) {
      if (!soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isGo ? 880 : 440, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    }

    score(isMilestone = false) {
      if (!soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = isMilestone ? [587.33, 783.99, 987.77, 1174.66] : [659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.065;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.42, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.19);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    }

    crash() {
      if (!soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.28);

      gain.gain.setValueAtTime(0.46, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
    }
  }

  const sfx = new SoundFX();

  // Background Music (Alabama.mp3)
  // Uses Web Audio GainNode so volume is properly reduced on iOS Safari (where HTMLAudioElement.volume is locked at 1.0)
  // and automatically stops when leaving Safari / switching apps.
  const MUSIC_GAIN_LEVEL = 0.15; // Soft background level so game SFX stay loud and clear
  const bgMusic = new Audio('audio/Alabama.mp3');
  bgMusic.loop = true;
  bgMusic.volume = MUSIC_GAIN_LEVEL;
  bgMusic.preload = 'auto';

  let musicBuffer = null;
  let musicSourceNode = null;
  let musicGainNode = null;
  let musicStartTime = 0;
  let musicPauseOffset = 0;
  let musicIsPlaying = false;
  let mediaElementConnected = false;

  // Pre-fetch & decode audio buffer on http/https so Web Audio handles playback & volume natively on iOS
  if (window.location.protocol.startsWith('http')) {
    fetch('audio/Alabama.mp3')
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        sfx.init();
        if (sfx.ctx) {
          return sfx.ctx.decodeAudioData(buf);
        }
        return null;
      })
      .then((decoded) => {
        if (decoded) {
          musicBuffer = decoded;
          if (musicIsPlaying && soundEnabled) {
            // Switch smoothly to buffer playback if already started
            bgMusic.pause();
            startBufferMusic();
          }
        }
      })
      .catch(() => {});
  }

  function startBufferMusic() {
    if (!sfx.ctx || !musicBuffer) return;
    stopBufferMusic(false);
    musicGainNode = sfx.ctx.createGain();
    musicGainNode.gain.setValueAtTime(MUSIC_GAIN_LEVEL, sfx.ctx.currentTime);
    musicGainNode.connect(sfx.ctx.destination);

    musicSourceNode = sfx.ctx.createBufferSource();
    musicSourceNode.buffer = musicBuffer;
    musicSourceNode.loop = true;
    musicSourceNode.connect(musicGainNode);

    const offset = musicPauseOffset % musicBuffer.duration;
    musicStartTime = sfx.ctx.currentTime - offset;
    musicSourceNode.start(0, offset);
  }

  function stopBufferMusic(saveOffset = true) {
    if (musicSourceNode) {
      if (saveOffset && sfx.ctx && musicBuffer) {
        musicPauseOffset = (sfx.ctx.currentTime - musicStartTime) % musicBuffer.duration;
      }
      try {
        musicSourceNode.stop();
        musicSourceNode.disconnect();
      } catch (_) {}
      musicSourceNode = null;
    }
  }

  function playMusic(restartIfStopped = false) {
    if (!soundEnabled || document.hidden) return;
    sfx.init();
    if (restartIfStopped) {
      musicPauseOffset = 0;
      try {
        bgMusic.currentTime = 0;
      } catch (_) {}
    }
    musicIsPlaying = true;

    if (musicBuffer && sfx.ctx) {
      bgMusic.pause();
      startBufferMusic();
      return;
    }

    // Fallback to HTMLAudioElement routed through Web Audio GainNode when possible
    try {
      if (sfx.ctx && !mediaElementConnected && window.location.protocol.startsWith('http')) {
        const src = sfx.ctx.createMediaElementSource(bgMusic);
        const gain = sfx.ctx.createGain();
        gain.gain.value = MUSIC_GAIN_LEVEL;
        src.connect(gain);
        gain.connect(sfx.ctx.destination);
        mediaElementConnected = true;
      }
      bgMusic.volume = MUSIC_GAIN_LEVEL;
      const p = bgMusic.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } catch (_) {}
  }

  function pauseMusic() {
    musicIsPlaying = false;
    stopBufferMusic(true);
    try {
      bgMusic.pause();
    } catch (_) {}
  }

  // Game State: 'START' | 'GET_READY' | 'PLAYING' | 'PAUSED' | 'COUNTDOWN' | 'GAMEOVER'
  let state = 'START';
  let width = 420;
  let height = 740;
  let dpr = 1;
  let groundHeight = 86;

  let score = 0;
  let frameTimer = 0;
  let pipeSpawnTimer = 0;
  let screenShake = 0;
  let flashAlpha = 0;
  let lastTime = performance.now();
  let countdownInterval = null;

  // Ryan Bird Entity
  const bird = {
    x: 115,
    y: 320,
    vy: 0,
    radius: 23,
    rotation: 0,
    wingAngle: 0,
    wingSpeed: 0.25,
    scaleX: 1,
    scaleY: 1,
    dizzyAngle: 0,
  };

  // World Arrays
  let pipes = [];
  let particles = [];
  let floatingTexts = [];
  let stars = [];
  let clouds = [];
  let buildings = [];
  let groundOffset = 0;

  // Quips & Milestones
  const CRASH_QUIPS = [
    'Ryan clipped a pipe!',
    'Gravity: 1, Ryan: 0.',
    'Keep the cap aerodynamic!',
    'That pipe came out of nowhere!',
    'So close! Run it back!',
    'Too much mustache drag!',
  ];

  const MILESTONE_CALLOUTS = {
    5: '🔥 WARMING UP!',
    10: '🚀 RYAN IS LOCKED IN!',
    20: '⚡ ABSOLUTE LEGEND!',
    30: '👑 UNSTOPPABLE RYAN!',
    50: '🐐 HALL OF FAME!',
  };

  function initEnvironment() {
    stars = [];
    for (let i = 0; i < 38; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.55),
        r: Math.random() * 1.7 + 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    clouds = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: (i * width) / 5 + Math.random() * 40,
        y: 65 + Math.random() * (height * 0.34),
        scale: 0.65 + Math.random() * 0.65,
        speed: 0.22 + Math.random() * 0.25,
      });
    }

    buildings = [];
    let bx = 0;
    while (bx < width * 2) {
      const bw = 28 + Math.random() * 34;
      const bh = 45 + Math.random() * 95;
      buildings.push({
        x: bx,
        w: bw,
        h: bh,
        windows: Math.floor(bh / 18),
      });
      bx += bw + 4;
    }
  }

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    groundHeight = Math.max(76, Math.min(100, height * 0.12));
    bird.x = Math.round(width * 0.28);
    if (state === 'START' || state === 'GET_READY') {
      bird.y = height * 0.44;
    }
    initEnvironment();
  }

  window.addEventListener('resize', resizeCanvas);

  function updateHudButtons() {
    soundToggleBtn.textContent = soundEnabled ? '🔊' : '🔇';
    soundToggleBtn.style.opacity = soundEnabled ? '1' : '0.65';
    themeToggleBtn.textContent = THEMES[currentThemeIndex].icon;
    styleToggleBtn.textContent = avatarStyle === 'cutout' ? '🧢' : '🖼️';
    pauseBtn.textContent = state === 'PAUSED' ? '▶️' : '⏸️';

    if (heroRyanImg) {
      heroRyanImg.src = avatarStyle === 'cutout' ? 'assets/ryan-cutout.png' : 'assets/ryan-hires.png';
      heroRyanImg.style.borderRadius = avatarStyle === 'cutout' ? '0' : '50%';
      heroRyanImg.style.border = avatarStyle === 'cutout' ? 'none' : '3px solid #fbbf24';
    }

    // Sync active state on all theme buttons
    themeButtons.forEach((btn) => {
      const idx = parseInt(btn.dataset.theme || '0', 10);
      btn.classList.toggle('active', idx === currentThemeIndex);
    });

    // Sync active state on all style buttons
    styleButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.style === avatarStyle);
    });

    // Sync active state on all difficulty buttons
    modeButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.difficulty === currentDifficulty);
    });
  }

  function clearCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    countdownOverlay.classList.remove('active');
    countdownOverlay.setAttribute('aria-hidden', 'true');
  }

  function pauseGame() {
    if (state === 'PLAYING' || state === 'GET_READY' || state === 'COUNTDOWN') {
      clearCountdown();
      pauseMusic();
      state = 'PAUSED';
      pauseOverlay.classList.add('active');
      pauseOverlay.setAttribute('aria-hidden', 'false');
      updateHudButtons();
    } else if (state === 'START') {
      // Allow opening settings/pause menu from start screen too if user taps pause button
      state = 'PAUSED';
      startOverlay.classList.remove('active');
      pauseOverlay.classList.add('active');
      pauseOverlay.setAttribute('aria-hidden', 'false');
      updateHudButtons();
    }
  }

  function startResumeCountdown() {
    if (state !== 'PAUSED') return;
    pauseOverlay.classList.remove('active');
    pauseOverlay.setAttribute('aria-hidden', 'true');
    liveScoreContainer.classList.add('visible');

    state = 'COUNTDOWN';
    updateHudButtons();

    let remaining = 3;
    countdownNumber.textContent = String(remaining);
    countdownOverlay.classList.add('active');
    countdownOverlay.setAttribute('aria-hidden', 'false');
    sfx.tick(false);

    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        countdownNumber.textContent = String(remaining);
        sfx.tick(false);
      } else {
        clearCountdown();
        sfx.tick(true);
        playMusic(false);
        state = 'PLAYING';
        // Give Ryan a gentle upward float on resume so the player isn't immediately dropping fast
        bird.vy = Math.min(bird.vy, -3.5);
        lastTime = performance.now();
        updateHudButtons();
      }
    }, 1000);
  }

  function spawnFlapParticles() {
    for (let i = 0; i < 7; i++) {
      const angle = Math.PI * 0.65 + (Math.random() - 0.5) * 0.9;
      const speed = 1.6 + Math.random() * 2.6;
      particles.push({
        x: bird.x - 16,
        y: bird.y + 6,
        vx: Math.cos(angle) * speed - 1.2,
        vy: Math.sin(angle) * speed,
        size: 3.5 + Math.random() * 3.5,
        alpha: 1,
        color: i % 2 === 0 ? '#fde047' : '#38bdf8',
      });
    }
  }

  function spawnCrashParticles() {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6.5;
      particles.push({
        x: bird.x,
        y: bird.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 4 + Math.random() * 5,
        alpha: 1,
        color: ['#fbbf24', '#ef4444', '#38bdf8', '#ffffff'][i % 4],
      });
    }
  }

  function showMilestoneToast(text) {
    milestoneToast.textContent = text;
    milestoneToast.classList.add('show');
    clearTimeout(showMilestoneToast._timer);
    showMilestoneToast._timer = setTimeout(() => {
      milestoneToast.classList.remove('show');
    }, 1700);
  }

  function resetGame() {
    clearCountdown();
    score = 0;
    liveScoreEl.textContent = '0';
    pipes = [];
    particles = [];
    floatingTexts = [];
    pipeSpawnTimer = 20;
    screenShake = 0;
    flashAlpha = 0;

    bird.x = Math.round(width * 0.28);
    bird.y = height * 0.44;
    bird.vy = 0;
    bird.rotation = 0;
    bird.scaleX = 1;
    bird.scaleY = 1;
  }

  function startGetReady() {
    resetGame();
    state = 'GET_READY';
    startOverlay.classList.remove('active');
    pauseOverlay.classList.remove('active');
    pauseOverlay.setAttribute('aria-hidden', 'true');
    gameOverOverlay.classList.remove('active');
    gameOverOverlay.setAttribute('aria-hidden', 'true');
    liveScoreContainer.classList.add('visible');
    shareFeedback.textContent = '';
    updateHudButtons();
    playMusic(false);
    flap();
  }

  function flap() {
    const cfg = DIFFICULTIES[currentDifficulty];
    if (state === 'START') {
      startGetReady();
      return;
    }
    if (state === 'GET_READY') {
      state = 'PLAYING';
      updateHudButtons();
    }
    if (state !== 'PLAYING') return;

    bird.vy = cfg.jumpVelocity;
    bird.scaleX = 1.14;
    bird.scaleY = 0.88;
    bird.wingSpeed = 0.55;
    spawnFlapParticles();
    sfx.flap();
  }

  function triggerGameOver() {
    if (state === 'GAMEOVER') return;
    clearCountdown();
    pauseMusic();
    state = 'GAMEOVER';
    updateHudButtons();
    screenShake = 14;
    flashAlpha = 0.65;
    spawnCrashParticles();
    sfx.crash();

    if (navigator.vibrate) {
      try {
        navigator.vibrate(90);
      } catch (_) {}
    }

    const isNewBest = score > bestScore;
    if (isNewBest) {
      bestScore = score;
      safeSet(STORAGE_KEYS.best, bestScore);
      hudBest.textContent = bestScore;
    }

    liveScoreContainer.classList.remove('visible');

    // Populate Game Over UI
    finalScoreEl.textContent = score;
    finalBestEl.textContent = bestScore;
    newRecordBadge.classList.toggle('hidden', !isNewBest);

    gameOverTitle.textContent = isNewBest && score > 0 ? 'NEW RECORD!' : 'WIPEOUT!';
    gameOverQuip.textContent = isNewBest && score > 0
      ? 'Ryan just set a new all-time high score!'
      : CRASH_QUIPS[Math.floor(Math.random() * CRASH_QUIPS.length)];

    // Medal calculation
    let medal = { badge: '🐣', name: 'ROOKIE RYAN', border: '#94a3b8' };
    if (score >= 40) {
      medal = { badge: '💎', name: 'GOAT RYAN', border: '#38bdf8' };
    } else if (score >= 25) {
      medal = { badge: '🥇', name: 'GOLD RYAN', border: '#fbbf24' };
    } else if (score >= 12) {
      medal = { badge: '🥈', name: 'SILVER RYAN', border: '#e2e8f0' };
    } else if (score >= 5) {
      medal = { badge: '🥉', name: 'BRONZE RYAN', border: '#d97706' };
    }

    medalBadge.textContent = medal.badge;
    medalName.textContent = medal.name;
    medalCircle.style.borderColor = medal.border;

    setTimeout(() => {
      if (state === 'GAMEOVER') {
        gameOverOverlay.classList.add('active');
        gameOverOverlay.setAttribute('aria-hidden', 'false');
      }
    }, 340);
  }

  function spawnPipe() {
    const cfg = DIFFICULTIES[currentDifficulty];
    const playAreaHeight = height - groundHeight;
    const dynamicGap = Math.max(cfg.pipeGap - Math.min(score * 0.45, 18), 124);
    const minTop = 68;
    const maxTop = Math.max(minTop + 40, playAreaHeight - dynamicGap - 90);
    const topHeight = minTop + Math.random() * (maxTop - minTop);

    pipes.push({
      x: width + 20,
      width: 66,
      topHeight,
      bottomY: topHeight + dynamicGap,
      gap: dynamicGap,
      passed: false,
    });
  }

  function update(dt) {
    // Freeze world physics while paused or during the 3-second countdown
    if (state === 'PAUSED' || state === 'COUNTDOWN') {
      bird.wingAngle += 0.12 * dt;
      return;
    }

    frameTimer += dt;
    const cfg = DIFFICULTIES[currentDifficulty];
    const playAreaHeight = height - groundHeight;

    if (screenShake > 0) {
      screenShake = Math.max(0, screenShake - dt * 0.9);
    }
    if (flashAlpha > 0) {
      flashAlpha = Math.max(0, flashAlpha - dt * 0.05);
    }

    bird.scaleX += (1 - bird.scaleX) * 0.18 * dt;
    bird.scaleY += (1 - bird.scaleY) * 0.18 * dt;

    if (state !== 'GAMEOVER') {
      const speedMult = state === 'PLAYING' ? cfg.pipeSpeed : 1.4;
      groundOffset = (groundOffset + speedMult * dt) % 36;

      for (const c of clouds) {
        c.x -= c.speed * dt;
        if (c.x < -120) {
          c.x = width + 80;
          c.y = 60 + Math.random() * (height * 0.34);
        }
      }

      for (const b of buildings) {
        b.x -= speedMult * 0.25 * dt;
      }
      if (buildings.length && buildings[0].x + buildings[0].w < -20) {
        const first = buildings.shift();
        const last = buildings[buildings.length - 1];
        first.x = last.x + last.w + 4;
        buildings.push(first);
      }
    }

    if (state === 'START' || state === 'GET_READY') {
      bird.y = height * 0.44 + Math.sin(frameTimer * 0.08) * 9;
      bird.rotation = Math.sin(frameTimer * 0.06) * 0.08;
      bird.wingAngle += 0.18 * dt;
    } else if (state === 'PLAYING') {
      bird.vy = Math.min(cfg.maxFallSpeed, bird.vy + cfg.gravity * dt);
      bird.y += bird.vy * dt;

      bird.wingSpeed = Math.max(0.18, bird.wingSpeed * 0.96);
      bird.wingAngle += bird.wingSpeed * dt;

      if (bird.vy < 0) {
        bird.rotation += (-0.32 - bird.rotation) * 0.28 * dt;
      } else {
        const targetRot = Math.min(Math.PI * 0.42, (bird.vy / cfg.maxFallSpeed) * 1.15);
        bird.rotation += (targetRot - bird.rotation) * 0.14 * dt;
      }

      if (bird.y - bird.radius < 8) {
        bird.y = bird.radius + 8;
        bird.vy = 0;
      }

      if (bird.y + bird.radius >= playAreaHeight) {
        bird.y = playAreaHeight - bird.radius;
        triggerGameOver();
      }

      pipeSpawnTimer += dt;
      if (pipeSpawnTimer >= cfg.pipeInterval) {
        pipeSpawnTimer = 0;
        spawnPipe();
      }

      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= cfg.pipeSpeed * dt;

        if (!p.passed && p.x + p.width < bird.x) {
          p.passed = true;
          score += 1;
          liveScoreEl.textContent = score;
          liveScoreEl.classList.remove('pop');
          void liveScoreEl.offsetWidth;
          liveScoreEl.classList.add('pop');

          const isMilestone = Boolean(MILESTONE_CALLOUTS[score]);
          sfx.score(isMilestone);

          floatingTexts.push({
            x: bird.x + 12,
            y: bird.y - 26,
            text: '+1',
            alpha: 1,
            vy: -1.6,
          });

          if (isMilestone) {
            showMilestoneToast(MILESTONE_CALLOUTS[score]);
          } else if (score === bestScore + 1 && bestScore > 0) {
            showMilestoneToast('🏆 NEW HIGH SCORE!');
          }
        }

        const hitRadius = bird.radius * 0.82;
        if (bird.x + hitRadius > p.x + 4 && bird.x - hitRadius < p.x + p.width - 4) {
          if (bird.y - hitRadius < p.topHeight || bird.y + hitRadius > p.bottomY) {
            triggerGameOver();
          }
        }

        if (p.x + p.width < -60) {
          pipes.splice(i, 1);
        }
      }
    } else if (state === 'GAMEOVER') {
      bird.dizzyAngle += 0.12 * dt;
      if (bird.y + bird.radius < playAreaHeight) {
        bird.vy = Math.min(12, bird.vy + 0.55 * dt);
        bird.y = Math.min(playAreaHeight - bird.radius, bird.y + bird.vy * dt);
        bird.rotation = Math.min(Math.PI * 0.5, bird.rotation + 0.12 * dt);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 0.12 * dt;
      pt.alpha -= 0.028 * dt;
      if (pt.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= 0.03 * dt;
      if (ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
      }
    }
  }

  function drawBackground(theme) {
    const playAreaHeight = height - groundHeight;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, playAreaHeight);
    skyGrad.addColorStop(0, theme.skyTop);
    skyGrad.addColorStop(0.58, theme.skyMid);
    skyGrad.addColorStop(1, theme.skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, playAreaHeight);

    ctx.save();
    for (const s of stars) {
      const twinkle = 0.35 + 0.65 * Math.sin(frameTimer * 0.04 + s.phase);
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.7})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const sunX = width * 0.74;
    const sunY = playAreaHeight * 0.26;
    const glowGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 95);
    glowGrad.addColorStop(0, theme.sunGlow);
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 95, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.sunColor;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.cloudColor;
    for (const c of clouds) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.arc(22, -6, 30, 0, Math.PI * 2);
      ctx.arc(48, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = theme.cityColor;
    for (const b of buildings) {
      if (b.x > width + 40) continue;
      const by = playAreaHeight - b.h - 24;
      ctx.fillRect(b.x, by, b.w, b.h + 24);
    }

    ctx.fillStyle = theme.farHill;
    ctx.beginPath();
    ctx.moveTo(0, playAreaHeight);
    for (let x = 0; x <= width; x += 20) {
      const y = playAreaHeight - 36 - Math.sin((x + groundOffset * 0.3) * 0.015) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, playAreaHeight);
    ctx.closePath();
    ctx.fill();
  }

  function drawRoundedRect(x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function drawPipes(theme) {
    const playAreaHeight = height - groundHeight;
    const capHeight = 26;
    const capOverhang = 5;

    for (const p of pipes) {
      const pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
      pipeGrad.addColorStop(0, theme.pipeBodyA);
      pipeGrad.addColorStop(0.28, theme.pipeBodyB);
      pipeGrad.addColorStop(0.75, theme.pipeBodyA);
      pipeGrad.addColorStop(1, theme.pipeBodyC);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = theme.pipeBorder;

      if (p.topHeight > 0) {
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(p.x, -2, p.width, p.topHeight);
        ctx.strokeRect(p.x, -2, p.width, p.topHeight);

        const capY = p.topHeight - capHeight;
        ctx.fillStyle = pipeGrad;
        drawRoundedRect(p.x - capOverhang, capY, p.width + capOverhang * 2, capHeight, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(p.x + 9, 0, 6, Math.max(0, capY - 2));
      }

      const bottomHeight = playAreaHeight - p.bottomY;
      if (bottomHeight > 0) {
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(p.x, p.bottomY, p.width, bottomHeight + 2);
        ctx.strokeRect(p.x, p.bottomY, p.width, bottomHeight + 2);

        ctx.fillStyle = pipeGrad;
        drawRoundedRect(p.x - capOverhang, p.bottomY, p.width + capOverhang * 2, capHeight, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(p.x + 9, p.bottomY + capHeight + 2, 6, Math.max(0, bottomHeight - capHeight - 4));
      }
    }
  }

  function drawGround(theme) {
    const playAreaHeight = height - groundHeight;

    ctx.fillStyle = theme.groundDirt;
    ctx.fillRect(0, playAreaHeight, width, groundHeight);

    ctx.fillStyle = theme.groundTop;
    ctx.fillRect(0, playAreaHeight, width, 18);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, playAreaHeight + 3, width, 12);
    ctx.clip();
    ctx.fillStyle = theme.groundStripe;
    for (let x = -40; x < width + 40; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x - groundOffset, playAreaHeight + 15);
      ctx.lineTo(x + 14 - groundOffset, playAreaHeight + 3);
      ctx.lineTo(x + 28 - groundOffset, playAreaHeight + 3);
      ctx.lineTo(x + 14 - groundOffset, playAreaHeight + 15);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.fillRect(0, playAreaHeight, width, 2);
  }

  function drawRyanBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    ctx.scale(bird.scaleX, bird.scaleY);

    // 1. Small animated wing tucked BEHIND Ryan on the left side (never covers his face!)
    const wingFlapY = Math.sin(bird.wingAngle) * 5;
    const wingRot = Math.sin(bird.wingAngle) * 0.45;
    ctx.save();
    ctx.translate(-22, 4 + wingFlapY * 0.25);
    ctx.rotate(wingRot);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 6.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. Draw Ryan's Face ON TOP completely unobstructed
    if (avatarStyle === 'cutout' && ryanCutoutImg.complete && ryanCutoutImg.naturalWidth > 0) {
      const imgW = 60;
      const imgH = 66;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(ryanCutoutImg, -imgW / 2, -imgH / 2, imgW, imgH);
      ctx.restore();
    } else if (ryanFullImg.complete && ryanFullImg.naturalWidth > 0) {
      const r = 26;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(ryanFullImg, -r, -r - 2, r * 2, r * 2.2);
      ctx.restore();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Dizzy stars above cap when crashed
    if (state === 'GAMEOVER') {
      for (let i = 0; i < 3; i++) {
        const a = bird.dizzyAngle + (i * Math.PI * 2) / 3;
        const sx = Math.cos(a) * 24;
        const sy = -32 + Math.sin(a) * 7;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', sx, sy);
      }
    }

    ctx.restore();
  }

  function drawEffects() {
    for (const pt of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = "700 20px 'Fredoka', sans-serif";
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function render() {
    ctx.save();
    if (screenShake > 0) {
      const dx = (Math.random() - 0.5) * screenShake;
      const dy = (Math.random() - 0.5) * screenShake;
      ctx.translate(dx, dy);
    }

    const theme = THEMES[currentThemeIndex];
    drawBackground(theme);
    drawPipes(theme);
    drawGround(theme);
    drawRyanBird();
    drawEffects();

    ctx.restore();
  }

  function loop(now) {
    const elapsedMs = Math.min(50, Math.max(1, now - lastTime));
    lastTime = now;
    const dt = elapsedMs / (1000 / 60);

    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  // Input Handling (Touch, Pointer, Keyboard)
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state === 'PLAYING' || state === 'GET_READY') {
      flap();
    }
  });

  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startGetReady();
  });

  retryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startGetReady();
  });

  pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state === 'PAUSED') {
      startResumeCountdown();
    } else if (state === 'PLAYING' || state === 'GET_READY' || state === 'COUNTDOWN' || state === 'START') {
      pauseGame();
    }
  });

  resumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startResumeCountdown();
  });

  restartFromPauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startGetReady();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      if (state === 'PLAYING' || state === 'GET_READY') {
        pauseGame();
      } else if (state === 'PAUSED') {
        startResumeCountdown();
      }
      return;
    }

    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (state === 'START') {
        startGetReady();
      } else if (state === 'PLAYING' || state === 'GET_READY') {
        flap();
      } else if (state === 'PAUSED') {
        startResumeCountdown();
      } else if (state === 'GAMEOVER' && gameOverOverlay.classList.contains('active')) {
        startGetReady();
      }
    }
  });

  // Difficulty Selection (Start screen & Pause menu)
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentDifficulty = btn.dataset.difficulty || 'classic';
      updateHudButtons();
    });
  });

  // Theme Selection (Start screen & Pause menu)
  themeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentThemeIndex = parseInt(btn.dataset.theme || '0', 10) || 0;
      safeSet(STORAGE_KEYS.theme, currentThemeIndex);
      updateHudButtons();
    });
  });

  // Style Selection (Pause menu)
  styleButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      avatarStyle = btn.dataset.style || 'cutout';
      safeSet(STORAGE_KEYS.style, avatarStyle);
      updateHudButtons();
    });
  });

  // Top HUD Buttons
  soundToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundEnabled = !soundEnabled;
    safeSet(STORAGE_KEYS.sound, soundEnabled);
    updateHudButtons();
    if (soundEnabled) {
      sfx.flap();
      if (state === 'PLAYING' || state === 'GET_READY') {
        playMusic(false);
      }
    } else {
      pauseMusic();
    }
  });

  themeToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    safeSet(STORAGE_KEYS.theme, currentThemeIndex);
    updateHudButtons();
    showMilestoneToast(`${THEMES[currentThemeIndex].icon} ${THEMES[currentThemeIndex].name}`);
  });

  styleToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarStyle = avatarStyle === 'cutout' ? 'badge' : 'cutout';
    safeSet(STORAGE_KEYS.style, avatarStyle);
    updateHudButtons();
    showMilestoneToast(avatarStyle === 'cutout' ? '🧢 Cutout Ryan Mode' : '🖼️ Framed Photo Mode');
  });

  // Share Score Button
  shareBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const shareText = `🧢✈️ I scored ${score} (Best: ${bestScore}) in Flappy Ryan! Can you beat me?`;
    const shareUrl = window.location.href.startsWith('http') ? window.location.href : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Flappy Ryan',
          text: shareText,
          url: shareUrl || undefined,
        });
        shareFeedback.textContent = 'Shared!';
        return;
      } catch (_) {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl ? `${shareText}\n${shareUrl}` : shareText);
      shareFeedback.textContent = '✅ Score copied to clipboard!';
    } catch (_) {
      shareFeedback.textContent = shareText;
    }
  });

  // Stop music & auto-pause immediately when leaving Safari / switching tabs / locking phone
  function handleAppBackgrounded() {
    pauseMusic();
    if (sfx.ctx && sfx.ctx.state === 'running') {
      try {
        sfx.ctx.suspend();
      } catch (_) {}
    }
    if (state === 'PLAYING' || state === 'GET_READY' || state === 'COUNTDOWN') {
      pauseGame();
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      handleAppBackgrounded();
    }
  });

  window.addEventListener('pagehide', handleAppBackgrounded);
  window.addEventListener('blur', () => {
    if (state === 'PLAYING' || state === 'GET_READY' || state === 'COUNTDOWN') {
      handleAppBackgrounded();
    } else {
      pauseMusic();
    }
  });

  // Initialize & Kickoff
  hudBest.textContent = bestScore;
  updateHudButtons();
  resizeCanvas();
  requestAnimationFrame((t) => {
    lastTime = t;
    loop(t);
  });
})();
