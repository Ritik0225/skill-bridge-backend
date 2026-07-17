/**
 * A minimal concurrency limiter (semaphore). Free AI tiers are rate-limited
 * per minute, so we cap how many calls run at once to avoid bursts of 429s.
 */
export function createLimiter(max: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  const acquire = (): Promise<void> =>
    new Promise((resolve) => {
      if (active < max) {
        active++;
        resolve();
      } else {
        queue.push(() => {
          active++;
          resolve();
        });
      }
    });

  const release = (): void => {
    active--;
    const next = queue.shift();
    if (next) next();
  };

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    await acquire();
    try {
      return await task();
    } finally {
      release();
    }
  };
}
