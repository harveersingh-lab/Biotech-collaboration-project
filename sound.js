// Sciderizer Audio & Persistent Music Controller
class PersistentAudioSystem {
    constructor() {
      const savedState = localStorage.getItem('sciderizer_sound_enabled');
      this.enabled = savedState !== null ? JSON.parse(savedState) : true;
      
      this.audioCtx = null;
      this.bgAudio = null;
      this.init();
    }
  
    init() {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupAudioElement();
        this.createToggleUI();
        this.bindEvents();
      });
    }
  
    setupAudioElement() {
      // Royalty-free calm Lofi MP3 stream
      const lofiMp3Url = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3";
  
      this.bgAudio = new Audio(lofiMp3Url);
      this.bgAudio.loop = true;
      this.bgAudio.volume = 0.25;
  
      // Read the exact timestamp saved right before the user clicked a link
      const savedTime = localStorage.getItem('sciderizer_lofi_time');
      if (savedTime) {
        this.bgAudio.currentTime = parseFloat(savedTime);
      }
  
      // Keep saving the current playback time every second
      setInterval(() => {
        if (this.bgAudio && !this.bgAudio.paused) {
          localStorage.setItem('sciderizer_lofi_time', this.bgAudio.currentTime);
        }
      }, 500);
  
      // Save timestamp immediately right when clicking a page link
      window.addEventListener('beforeunload', () => {
        if (this.bgAudio) {
          localStorage.setItem('sciderizer_lofi_time', this.bgAudio.currentTime);
        }
      });
  
      if (this.enabled) {
        this.startMusic();
      }
    }
  
    startMusic() {
      if (!this.bgAudio || !this.enabled) return;
      
      this.bgAudio.play().catch(() => {
        // Browser blocked autoplay; resumes smoothly on the user's first click
        const unlockAudio = () => {
          if (this.enabled && this.bgAudio && this.bgAudio.paused) {
            this.bgAudio.play();
          }
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
        };
        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);
      });
    }
  
    stopMusic() {
      if (this.bgAudio) {
        this.bgAudio.pause();
      }
    }
  
    getAudioContext() {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    }
  
    createToggleUI() {
      // Remove old button if duplicate exists
      const existingBtn = document.getElementById('soundToggleBtn');
      if (existingBtn) existingBtn.remove();
  
      const btn = document.createElement('button');
      btn.id = 'soundToggleBtn';
      btn.className = `sound-toggle-btn ${!this.enabled ? 'muted' : ''}`;
      btn.setAttribute('aria-label', 'Toggle Sound and Music');
      btn.innerHTML = `
        <span class="sound-icon">${this.enabled ? '🔊' : '🔇'}</span>
        <span class="sound-label">SFX & Music: <strong>${this.enabled ? 'ON' : 'OFF'}</strong></span>
      `;
      document.body.appendChild(btn);
  
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }
  
    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('sciderizer_sound_enabled', JSON.stringify(this.enabled));
  
      const btn = document.getElementById('soundToggleBtn');
      if (btn) {
        btn.classList.toggle('muted', !this.enabled);
        btn.querySelector('.sound-icon').textContent = this.enabled ? '🔊' : '🔇';
        btn.querySelector('.sound-label').innerHTML = `SFX & Music: <strong>${this.enabled ? 'ON' : 'OFF'}</strong>`;
      }
  
      if (this.enabled) {
        this.startMusic();
        this.playSFX('navbar');
      } else {
        this.stopMusic();
      }
    }
  
    playSFX(type = 'click') {
      if (!this.enabled) return;
  
      try {
        const ctx = this.getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
  
        const now = ctx.currentTime;
  
        if (type === 'navbar') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === 'option') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(250, now + 0.06);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          osc.start(now);
          osc.stop(now + 0.06);
        }
      } catch (err) {
        console.warn("Audio Context unlock required user gesture.", err);
      }
    }
  
    bindEvents() {
      document.addEventListener('click', (e) => {
        // Ensure background music starts on user click if blocked initially by browser policy
        if (this.enabled && this.bgAudio && this.bgAudio.paused) {
          this.bgAudio.play();
        }
  
        const target = e.target.closest('a, button, .opt, .q-toggle, .tab-btn, .barebells-btn, .btn-pill, .test-start-btn');
        if (!target || target.id === 'soundToggleBtn') return;
  
        if (target.closest('.navbar')) {
          this.playSFX('navbar');
        } else if (target.classList.contains('opt')) {
          this.playSFX('option');
        } else {
          this.playSFX('click');
        }
      });
    }
  }
  
  const audioEngine = new PersistentAudioSystem();

// Responsive header offset: the fixed header changes height on small screens
// (the nav can wrap), so measure it and give the page matching top padding.
(function () {
  function setHeaderOffset() {
    var h = document.querySelector('.fixed-header-wrapper');
    if (h) document.documentElement.style.setProperty('--header-h', h.offsetHeight + 'px');
  }
  document.addEventListener('DOMContentLoaded', function () {
    setHeaderOffset();
    var h = document.querySelector('.fixed-header-wrapper');
    if (h && 'ResizeObserver' in window) new ResizeObserver(setHeaderOffset).observe(h);
  });
  window.addEventListener('load', setHeaderOffset);
  window.addEventListener('resize', setHeaderOffset);
  window.addEventListener('orientationchange', setHeaderOffset);
})();
