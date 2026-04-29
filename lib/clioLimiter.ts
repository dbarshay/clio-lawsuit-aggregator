type Task<T> = () => Promise<T>;

export type ClioLimitCategory = "search" | "matter" | "contact" | "token" | "default";

const GLOBAL_MAX_CONCURRENT = 3;

const CATEGORY_LIMITS: Record<ClioLimitCategory, number> = {
  search: 1,
  matter: 2,
  contact: 2,
  token: 1,
  default: 2,
};

let globalActive = 0;

const categoryActive: Record<ClioLimitCategory, number> = {
  search: 0,
  matter: 0,
  contact: 0,
  token: 0,
  default: 0,
};

type QueueItem = {
  category: ClioLimitCategory;
  run: () => void;
};

const queue: QueueItem[] = [];

function canRun(category: ClioLimitCategory) {
  return (
    globalActive < GLOBAL_MAX_CONCURRENT &&
    categoryActive[category] < CATEGORY_LIMITS[category]
  );
}

function runNext() {
  const idx = queue.findIndex((item) => canRun(item.category));
  if (idx === -1) return;

  const [next] = queue.splice(idx, 1);

  globalActive++;
  categoryActive[next.category]++;

  next.run();
}

export async function runWithClioLimit<T>(
  category: ClioLimitCategory,
  task: Task<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const wrapped = async () => {
      try {
        const result = await task();
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        globalActive--;
        categoryActive[category]--;
        runNext();
      }
    };

    queue.push({ category, run: wrapped });
    runNext();
  });
}
