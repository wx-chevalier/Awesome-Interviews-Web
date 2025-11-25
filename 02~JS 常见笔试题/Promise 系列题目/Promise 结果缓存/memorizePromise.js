export function memorizePromise(fn) {
  const cache = new Map();

  return function (...args) {
    // 序列化 Key
    const key = JSON.stringify(args);

    // 判断是否有缓存

    if (cache.has(key)) {
      return cache.get(key);
    }

    // 等待结果
    const promise = fn.apply(this, args).finally(() => {
      // 可选：如果需要，可以在 Promise 完成后进行某些操作
      // 比如记录日志，或者在特定条件下清除缓存
    });

    cache.set(key, promise);
    return promise;
  };
}
