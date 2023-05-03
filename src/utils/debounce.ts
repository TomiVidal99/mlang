export function debounce({ func, delay }: { func: Function; delay: number; }): Function {
  let timerId: NodeJS.Timeout;

  return function (...args: any[]) {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
