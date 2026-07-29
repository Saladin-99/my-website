const CUE = Object.freeze({
  MOBILE_TAP: "mobile-tap",
  MOBILE_UNLOCK: "mobile-unlock",
  MOBILE_NOTIFICATION: "mobile-notification",
  DESKTOP_CLICK: "desktop-click",
  DESKTOP_LOGIN: "desktop-login",
});

export const SALAH_AUDIO_CUES = CUE;

const FAMILY_LIMITS = Object.freeze({
  "mobile-tap": 5,
  "mobile-unlock": 1,
  "mobile-notification": 1,
  "desktop-click": 5,
  "desktop-login": 1,
});

const CUE_COOLDOWNS = Object.freeze({
  "mobile-tap": 0.024,
  "mobile-unlock": 0.8,
  "mobile-notification": 0.12,
  "desktop-click": 0.028,
  "desktop-login": 0.8,
});

const DECORATIVE_CUES = new Set([
  CUE.MOBILE_UNLOCK,
  CUE.MOBILE_NOTIFICATION,
  CUE.DESKTOP_LOGIN,
]);

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

class SalahAudioEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.compressor = null;
    this.noiseBuffer = null;
    this.voices = new Set();
    this.voicesByFamily = new Map();
    this.lastPlayedAt = new Map();
    this.variantCounters = new Map();
    this.pendingCues = [];
    this.pendingCueTimers = new Set();
    this.clientCount = 0;
    this.muted = false;
    this.resumePromise = null;
    this.closeTimer = null;
    this.lifecycleAttached = false;
    this.activationObserved = false;

    this.handleActivationGesture = this.handleActivationGesture.bind(this);
    this.handleContextStateChange =
      this.handleContextStateChange.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handlePageHide = this.handlePageHide.bind(this);
  }

  get supported() {
    if (!isBrowser()) return false;
    return Boolean(window.AudioContext || window.webkitAudioContext);
  }

  get ready() {
    return this.context?.state === "running";
  }

  acquire() {
    this.clientCount += 1;
    if (this.closeTimer !== null) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.attachLifecycle();

    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.clientCount = Math.max(0, this.clientCount - 1);
      if (this.clientCount === 0) this.scheduleClose();
    };
  }

  attachLifecycle() {
    if (!isBrowser() || this.lifecycleAttached) return;
    this.lifecycleAttached = true;
    window.addEventListener("pointerdown", this.handleActivationGesture, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchstart", this.handleActivationGesture, {
      capture: true,
      passive: true,
    });
    window.addEventListener("click", this.handleActivationGesture, true);
    window.addEventListener("keydown", this.handleActivationGesture, true);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("pagehide", this.handlePageHide);
  }

  detachLifecycle() {
    if (!isBrowser() || !this.lifecycleAttached) return;
    this.lifecycleAttached = false;
    window.removeEventListener(
      "pointerdown",
      this.handleActivationGesture,
      true,
    );
    window.removeEventListener(
      "touchstart",
      this.handleActivationGesture,
      true,
    );
    window.removeEventListener("click", this.handleActivationGesture, true);
    window.removeEventListener("keydown", this.handleActivationGesture, true);
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    window.removeEventListener("pagehide", this.handlePageHide);
  }

  handleActivationGesture() {
    this.activationObserved = true;
    void this.activate({ fromGesture: true }).then((active) => {
      if (active) this.flushPendingCues();
    });
  }

  handleContextStateChange() {
    if (this.context?.state === "running") {
      this.flushPendingCues();
    }
  }

  handleVisibilityChange() {
    if (document.visibilityState !== "hidden") return;
    this.stopAll(0.025);
    if (this.context?.state === "running") {
      void this.context.suspend().catch(() => {});
    }
  }

  handlePageHide() {
    this.stopAll(0.015);
  }

  scheduleClose() {
    if (!isBrowser() || this.closeTimer !== null) return;
    this.clearPendingCues();
    this.closeTimer = window.setTimeout(() => {
      this.closeTimer = null;
      if (this.clientCount !== 0) return;
      this.detachLifecycle();
      this.stopAll(0.01);
      const context = this.context;
      this.context = null;
      this.master = null;
      this.compressor = null;
      this.noiseBuffer = null;
      this.resumePromise = null;
      this.clearPendingCues();
      if (context && context.state !== "closed") {
        context.removeEventListener(
          "statechange",
          this.handleContextStateChange,
        );
        void context.close().catch(() => {});
      }
    }, 4000);
  }

  ensureContext() {
    if (!this.supported) return null;
    if (this.context && this.context.state !== "closed") return this.context;

    this.attachLifecycle();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let context;
    try {
      context = new AudioContext({ latencyHint: "interactive" });
    } catch {
      try {
        context = new AudioContext();
      } catch {
        return null;
      }
    }
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();

    master.gain.value = 0.72;
    compressor.threshold.value = -18;
    compressor.knee.value = 16;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.14;

    master.connect(compressor);
    compressor.connect(context.destination);

    this.context = context;
    this.master = master;
    this.compressor = compressor;
    context.addEventListener(
      "statechange",
      this.handleContextStateChange,
    );
    return context;
  }

  primeContext(context) {
    if (!context || context.state === "closed") return;

    // WebKit still expects a source to be started synchronously inside the
    // trusted gesture in some versions. A one-sample, zero-gain buffer keeps
    // the first real interface cue from being swallowed without producing an
    // audible click.
    try {
      const source = context.createBufferSource();
      const silentGain = context.createGain();
      source.buffer = context.createBuffer(1, 1, context.sampleRate);
      silentGain.gain.value = 0;
      source.connect(silentGain);
      silentGain.connect(context.destination);
      source.addEventListener(
        "ended",
        () => {
          source.disconnect();
          silentGain.disconnect();
        },
        { once: true },
      );
      source.start(0);
    } catch {
      // Context resume below remains the standards-based fallback.
    }
  }

  hasUserActivation() {
    if (!isBrowser()) return false;
    return Boolean(
      this.activationObserved ||
        navigator.userActivation?.isActive ||
        navigator.userActivation?.hasBeenActive,
    );
  }

  async activate({ fromGesture = false } = {}) {
    if (fromGesture) this.activationObserved = true;
    if (this.context?.state === "running") return true;

    // Calling resume before a trusted gesture can leave its promise pending in
    // some engines. That stale promise then prevents the first real gesture
    // from retrying, so defer context creation until activation is observable.
    if (!this.hasUserActivation()) return false;

    const context = this.ensureContext();
    if (!context) return false;
    if (fromGesture) this.primeContext(context);
    if (context.state === "running") return true;
    if (this.resumePromise && !fromGesture) return this.resumePromise;

    let resume;
    try {
      resume = context.resume();
    } catch {
      return false;
    }

    const currentAttempt = Promise.resolve(resume)
      .then(() => context.state === "running")
      .catch(() => false);
    let timeout;
    const boundedAttempt = Promise.race([
      currentAttempt,
      new Promise((resolve) => {
        timeout = window.setTimeout(() => resolve(false), 1200);
      }),
    ]).finally(() => {
      window.clearTimeout(timeout);
      if (this.resumePromise === boundedAttempt) {
        this.resumePromise = null;
      }
    });

    this.resumePromise = boundedAttempt;
    return boundedAttempt;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.muted) this.stopAll(0.018);
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  getState() {
    return {
      muted: this.muted,
      ready: this.ready,
      supported: this.supported,
    };
  }

  async play(cue, options = {}) {
    if (!Object.values(CUE).includes(cue)) {
      throw new RangeError(`Unknown Salah audio cue: ${cue}`);
    }
    if (this.muted || options.enabled === false) return false;

    const reducedSensory = options.reducedSensory === true;
    if (reducedSensory && DECORATIVE_CUES.has(cue)) return false;

    const running = await this.activate();
    const context = this.context;
    if (!running || !context || !this.master) {
      if (options.deferUntilActive === true) {
        this.deferCue(cue, options);
      }
      return false;
    }

    const now = context.currentTime;
    const cooldown = CUE_COOLDOWNS[cue] ?? 0;
    if (now - (this.lastPlayedAt.get(cue) ?? -Infinity) < cooldown) {
      return false;
    }
    this.lastPlayedAt.set(cue, now);

    const requestedVolume = Number.isFinite(options.volume)
      ? options.volume
      : 1;
    const volume =
      clamp(requestedVolume, 0, 1.5) * (reducedSensory ? 0.42 : 1);
    const variant = Number.isInteger(options.variant)
      ? Math.abs(options.variant) % 2
      : this.nextVariant(cue);

    switch (cue) {
      case CUE.MOBILE_TAP:
        this.scheduleMobileTap(now, volume, variant);
        break;
      case CUE.MOBILE_UNLOCK:
        this.scheduleMobileUnlock(now, volume);
        break;
      case CUE.MOBILE_NOTIFICATION:
        this.scheduleMobileNotification(now, volume);
        break;
      case CUE.DESKTOP_CLICK:
        this.scheduleDesktopClick(now, volume, variant);
        break;
      case CUE.DESKTOP_LOGIN:
        this.scheduleDesktopLogin(now, volume);
        break;
    }

    return true;
  }

  playMobileTap(options) {
    return this.play(CUE.MOBILE_TAP, {
      deferUntilActive: true,
      maxDelayMs: 1200,
      ...options,
    });
  }

  playMobileUnlock(options) {
    return this.play(CUE.MOBILE_UNLOCK, {
      deferUntilActive: true,
      // The Home notification is dispatched about 1.09 seconds after the
      // unlock succeeds. A short expiry guarantees a late autoplay retry
      // cannot invert or overlap that two-cue sequence.
      maxDelayMs: 420,
      ...options,
    });
  }

  playMobileNotification(options) {
    return this.play(CUE.MOBILE_NOTIFICATION, {
      deferUntilActive: true,
      maxDelayMs: 1800,
      ...options,
    });
  }

  playDesktopClick(options) {
    return this.play(CUE.DESKTOP_CLICK, {
      deferUntilActive: true,
      maxDelayMs: 1200,
      ...options,
    });
  }

  playDesktopLogin(options) {
    return this.play(CUE.DESKTOP_LOGIN, {
      deferUntilActive: true,
      maxDelayMs: 2400,
      ...options,
    });
  }

  deferCue(cue, options) {
    const maxDelayMs = clamp(
      Number.isFinite(options.maxDelayMs) ? options.maxDelayMs : 2000,
      0,
      30000,
    );
    if (maxDelayMs === 0) return;

    // A fresh instance supersedes a stale copy of the same semantic cue while
    // retaining the order between different cues (unlock, then notification).
    this.pendingCues = this.pendingCues.filter(
      (pending) => pending.cue !== cue,
    );
    this.pendingCues.push({
      cue,
      queuedAt: Date.now(),
      expiresAt: Date.now() + maxDelayMs,
      options: {
        ...options,
        deferUntilActive: false,
      },
    });
  }

  flushPendingCues() {
    if (!this.ready || this.pendingCues.length === 0) return;

    const pending = [...this.pendingCues];
    this.pendingCues = [];
    const now = Date.now();
    const playable = pending
      .filter((deferred) => deferred.expiresAt >= now)
      .sort((left, right) => left.queuedAt - right.queuedAt);
    const firstQueuedAt = playable[0]?.queuedAt ?? now;

    playable.forEach((deferred) => {
      // Recreate the intended ordering if multiple cinematic cues accumulated
      // before permission was available. Long dormant gaps are capped so the
      // interface does not spend seconds replaying stale silence.
      const delayMs = clamp(
        deferred.queuedAt - firstQueuedAt,
        0,
        1400,
      );
      const playDeferred = () => {
        void this.play(deferred.cue, deferred.options);
      };

      if (delayMs === 0) {
        playDeferred();
        return;
      }

      const timer = window.setTimeout(() => {
        this.pendingCueTimers.delete(timer);
        playDeferred();
      }, delayMs);
      this.pendingCueTimers.add(timer);
    });
  }

  clearPendingCues() {
    this.pendingCues = [];
    this.pendingCueTimers.forEach((timer) => window.clearTimeout(timer));
    this.pendingCueTimers.clear();
  }

  nextVariant(cue) {
    const next = (this.variantCounters.get(cue) ?? 0) + 1;
    this.variantCounters.set(cue, next);
    return next % 2;
  }

  createVoice(family, duration, replaceFamily = false) {
    const context = this.context;
    if (!context || !this.master) return null;
    if (replaceFamily) this.stopFamily(family, 0.012);

    const familyVoices = this.voicesByFamily.get(family) ?? new Set();
    const limit = FAMILY_LIMITS[family] ?? 4;
    while (familyVoices.size >= limit) {
      const oldestVoice = familyVoices.values().next().value;
      if (!oldestVoice) break;
      familyVoices.delete(oldestVoice);
      oldestVoice.stop(0.008);
    }

    const output = context.createGain();
    output.gain.value = 1;
    output.connect(this.master);

    const sources = new Set();
    const nodes = new Set([output]);
    let disposed = false;
    let stopping = false;
    let cleanupTimer = null;

    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      if (cleanupTimer !== null) window.clearTimeout(cleanupTimer);
      sources.forEach((source) => {
        source.onended = null;
        try {
          source.disconnect();
        } catch {
          // A source can already be disconnected by the browser after ending.
        }
      });
      nodes.forEach((node) => {
        try {
          node.disconnect();
        } catch {
          // A shared node may already be disconnected during rapid replacement.
        }
      });
      sources.clear();
      nodes.clear();
      this.voices.delete(voice);
      familyVoices.delete(voice);
      if (familyVoices.size === 0) this.voicesByFamily.delete(family);
    };

    const voice = {
      family,
      output,
      sources,
      nodes,
      addNode: (node) => {
        nodes.add(node);
        return node;
      },
      addSource: (source) => {
        sources.add(source);
        return source;
      },
      stop: (fadeSeconds = 0.02) => {
        if (disposed || stopping) return;
        stopping = true;
        const stopAt = context.currentTime + Math.max(0.004, fadeSeconds);
        output.gain.cancelScheduledValues(context.currentTime);
        output.gain.setValueAtTime(
          Math.max(0.0001, output.gain.value),
          context.currentTime,
        );
        output.gain.exponentialRampToValueAtTime(0.0001, stopAt);
        sources.forEach((source) => {
          try {
            source.stop(stopAt + 0.006);
          } catch {
            // An AudioBufferSourceNode or OscillatorNode can only be stopped once.
          }
        });
        window.setTimeout(cleanup, (fadeSeconds + 0.04) * 1000);
      },
      cleanup,
    };

    familyVoices.add(voice);
    this.voicesByFamily.set(family, familyVoices);
    this.voices.add(voice);
    cleanupTimer = window.setTimeout(cleanup, duration * 1000 + 300);
    return voice;
  }

  stopFamily(family, fadeSeconds) {
    const familyVoices = this.voicesByFamily.get(family);
    if (!familyVoices) return;
    [...familyVoices].forEach((voice) => voice.stop(fadeSeconds));
  }

  stopAll(fadeSeconds = 0.02) {
    this.clearPendingCues();
    [...this.voices].forEach((voice) => voice.stop(fadeSeconds));
  }

  getNoiseBuffer() {
    if (this.noiseBuffer) return this.noiseBuffer;
    const context = this.context;
    if (!context) return null;

    const length = Math.ceil(context.sampleRate * 0.12);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 0x51a7;
    for (let index = 0; index < length; index += 1) {
      seed = (seed * 16807) % 2147483647;
      data[index] = (seed / 1073741823.5 - 1) * (1 - index / length);
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  addTone(
    voice,
    {
      start,
      duration,
      frequency,
      endFrequency = frequency,
      gain,
      type = "sine",
      attack = 0.004,
      pan = 0,
    },
  ) {
    const context = this.context;
    if (!context || !voice) return;
    const oscillator = voice.addSource(context.createOscillator());
    const envelope = voice.addNode(context.createGain());
    const stop = start + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      stop,
    );
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, gain),
      start + Math.min(attack, duration * 0.35),
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, stop);

    oscillator.connect(envelope);
    if (typeof context.createStereoPanner === "function" && pan !== 0) {
      const panner = voice.addNode(context.createStereoPanner());
      panner.pan.value = clamp(pan, -1, 1);
      envelope.connect(panner);
      panner.connect(voice.output);
    } else {
      envelope.connect(voice.output);
    }

    oscillator.start(start);
    oscillator.stop(stop + 0.015);
  }

  addNoise(
    voice,
    { start, duration, gain, frequency, type = "bandpass", q = 0.7 },
  ) {
    const context = this.context;
    const buffer = this.getNoiseBuffer();
    if (!context || !buffer || !voice) return;
    const source = voice.addSource(context.createBufferSource());
    const filter = voice.addNode(context.createBiquadFilter());
    const envelope = voice.addNode(context.createGain());
    const stop = start + duration;

    source.buffer = buffer;
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    envelope.gain.setValueAtTime(Math.max(0.0001, gain), start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, stop);

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(voice.output);
    source.start(start);
    source.stop(stop + 0.005);
  }

  addGlassNote(voice, start, frequency, duration, gain, pan = 0) {
    this.addTone(voice, {
      start,
      duration,
      frequency,
      endFrequency: frequency * 0.998,
      gain,
      type: "sine",
      attack: 0.009,
      pan,
    });
    this.addTone(voice, {
      start: start + 0.002,
      duration: duration * 0.72,
      frequency: frequency * 2.004,
      endFrequency: frequency * 1.997,
      gain: gain * 0.19,
      type: "triangle",
      attack: 0.005,
      pan: -pan,
    });
  }

  scheduleMobileTap(now, volume, variant) {
    const voice = this.createVoice(CUE.MOBILE_TAP, 0.085);
    if (!voice) return;
    const start = now + 0.004;
    this.addNoise(voice, {
      start,
      duration: variant ? 0.036 : 0.031,
      gain: 0.052 * volume,
      frequency: variant ? 1450 : 1180,
      q: 0.58,
    });
    this.addTone(voice, {
      start,
      duration: variant ? 0.052 : 0.046,
      frequency: variant ? 205 : 184,
      endFrequency: variant ? 128 : 116,
      gain: 0.036 * volume,
      type: "sine",
      attack: 0.002,
    });
  }

  scheduleDesktopClick(now, volume, variant) {
    const voice = this.createVoice(CUE.DESKTOP_CLICK, 0.12);
    if (!voice) return;
    const start = now + 0.004;
    this.addNoise(voice, {
      start,
      duration: 0.022,
      gain: 0.043 * volume,
      frequency: variant ? 2380 : 2040,
      q: 1.1,
    });
    this.addTone(voice, {
      start,
      duration: 0.035,
      frequency: variant ? 465 : 410,
      endFrequency: variant ? 228 : 196,
      gain: 0.042 * volume,
      type: "square",
      attack: 0.0015,
    });
    this.addNoise(voice, {
      start: start + (variant ? 0.048 : 0.041),
      duration: 0.018,
      gain: 0.025 * volume,
      frequency: variant ? 1720 : 1880,
      q: 0.9,
    });
  }

  scheduleMobileUnlock(now, volume) {
    const voice = this.createVoice(CUE.MOBILE_UNLOCK, 0.56, true);
    if (!voice) return;
    const start = now + 0.008;

    // A tiny mechanical release gives way to two pearly, asymmetrical notes.
    // The interval and envelopes are bespoke to Salah Mobile rather than
    // imitating a familiar handset or operating-system unlock sound.
    this.addNoise(voice, {
      start,
      duration: 0.034,
      gain: 0.038 * volume,
      frequency: 1120,
      q: 0.86,
    });
    this.addTone(voice, {
      start,
      duration: 0.13,
      frequency: 174.61,
      endFrequency: 246.94,
      gain: 0.046 * volume,
      type: "triangle",
      attack: 0.003,
      pan: -0.08,
    });
    this.addGlassNote(
      voice,
      start + 0.074,
      392,
      0.3,
      0.078 * volume,
      -0.14,
    );
    this.addGlassNote(
      voice,
      start + 0.184,
      587.33,
      0.35,
      0.068 * volume,
      0.13,
    );
  }

  scheduleMobileNotification(now, volume) {
    // Notification arrival owns the next moment in the choreography. This is
    // normally a no-op because unlock has resolved, but it also protects
    // against timer throttling or a browser resuming audio unusually late.
    this.stopFamily(CUE.MOBILE_UNLOCK, 0.025);
    const voice = this.createVoice(
      CUE.MOBILE_NOTIFICATION,
      0.82,
      true,
    );
    if (!voice) return;
    const start = now + 0.015;
    this.addGlassNote(voice, start, 523.25, 0.42, 0.105 * volume, -0.12);
    this.addGlassNote(
      voice,
      start + 0.105,
      659.25,
      0.46,
      0.095 * volume,
      0.12,
    );
    this.addGlassNote(
      voice,
      start + 0.235,
      783.99,
      0.53,
      0.078 * volume,
      0,
    );
  }

  scheduleDesktopLogin(now, volume) {
    const voice = this.createVoice(CUE.DESKTOP_LOGIN, 1.42, true);
    if (!voice) return;
    const start = now + 0.02;
    const notes = [
      [0, 246.94, 0.45, 0.072, -0.14],
      [0.145, 369.99, 0.48, 0.068, 0.12],
      [0.292, 493.88, 0.55, 0.064, -0.06],
      [0.475, 587.33, 0.62, 0.071, 0.1],
      [0.69, 739.99, 0.7, 0.059, 0],
    ];
    notes.forEach(([offset, frequency, duration, gain, pan]) => {
      this.addGlassNote(
        voice,
        start + offset,
        frequency,
        duration,
        gain * volume,
        pan,
      );
    });
    this.addTone(voice, {
      start: start + 0.68,
      duration: 0.68,
      frequency: 184.99,
      endFrequency: 185.2,
      gain: 0.028 * volume,
      type: "triangle",
      attack: 0.035,
    });
  }
}

export const salahAudio = new SalahAudioEngine();
