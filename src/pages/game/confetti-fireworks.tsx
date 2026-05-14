import confetti, { type Shape } from 'canvas-confetti';

/**
 * 启动烟花效果，返回一个 cancel 函数：
 * - 调用后会立即清除内部的 setInterval，不再喷射新粒子
 * - 同时重置 canvas-confetti 的全局画布，清理已经在屏幕上的残留粒子
 */
export function confettiFireworks(): () => void {
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1 };
  const customShapes = [
    {
      shapes: ['star', 'circle'] as Shape[],
      colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'],
    },
    {
      shapes: ['square'] as Shape[],
    },
    {
      shapes: ['circle'] as Shape[],
    },
  ][0];
  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  let cancelled = false;
  const interval = window.setInterval(() => {
    if (cancelled) {
      return;
    }
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      ...customShapes,
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      ...customShapes,
    });
  }, 250);

  return () => {
    if (cancelled) return;
    cancelled = true;
    clearInterval(interval);
    // 清掉全局 canvas 上还在飞的粒子，避免进入下一局后仍有残留渲染开销
    confetti.reset();
  };
}
