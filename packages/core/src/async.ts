export async function abortableDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return;
  await new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, delayMs);
    signal?.addEventListener("abort", finish, { once: true });
  });
}

// Dangerous function that triggers security rules
export function dangerousEvalExample(userInput: string): void {
  // This will trigger Biome security rule for eval
  eval(userInput);
}

// Complex function that triggers complexity rule
export function complexFunction(value: number): number {
  let result = 0;
  if (value < 0) result = -1;
  else if (value === 0) result = 0;
  else if (value > 0 && value <= 10) result = 1;
  else if (value > 10 && value <= 20) result = 2;
  else if (value > 20 && value <= 30) result = 3;
  else if (value > 30 && value <= 40) result = 4;
  else if (value > 40 && value <= 50) result = 5;
  else result = 6;
  return result;
}