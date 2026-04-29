type Task<T> = () => Promise<T>;

const MAX_CONCURRENT = 2;

let active = 0;
const queue: (() => void)[] = [];

function runNext() {
  if (active >= MAX_CONCURRENT) return;

  const next = queue.shift();
  if (!next) return;

  active++;
  next();
}

export async function runWithClioLimit<T>(task: Task<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const wrapped = async () => {
      try {
        const result = await task();
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        active--;
        runNext();
      }
    };

    queue.push(wrapped);
    runNext();
  });
}
