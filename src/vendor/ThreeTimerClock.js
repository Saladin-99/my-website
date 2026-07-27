import { Timer } from "three";

/**
 * React Three Fiber 9 still expects the legacy Clock surface. This adapter
 * preserves that small API while using Three's current Timer internally.
 */
class ThreeTimerClock {
  constructor(autoStart = true) {
    this.autoStart = autoStart;
    this.running = false;
    this.elapsedTime = 0;
    this.oldTime = 0;
    this.timer = new Timer();

    if (autoStart) this.start();
  }

  start() {
    this.timer = new Timer();
    this.timer.reset();
    this.running = true;
    this.elapsedTime = 0;
    this.oldTime = 0;
  }

  stop() {
    this.running = false;
    this.autoStart = false;
  }

  getDelta() {
    if (this.autoStart && !this.running) this.start();
    if (!this.running) return 0;

    this.timer.update();
    const delta = this.timer.getDelta();
    this.oldTime = this.elapsedTime;
    this.elapsedTime += delta;
    return delta;
  }

  getElapsedTime() {
    return this.elapsedTime;
  }
}

export { ThreeTimerClock };
