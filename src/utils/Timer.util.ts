export class TimerManager {
  private timers: { [key: string]: NodeJS.Timeout } = {};

  setTimer(key: string, duration: number, callback: () => void): void {
    this.clearTimer(key);
    this.timers[key] = setTimeout(() => {
      callback();
      this.clearTimer(key);
    }, duration);
  }

  clearTimer(key: string): void {
    if (this.timers[key]) {
      clearTimeout(this.timers[key]);
      delete this.timers[key];
    }
  }
}
