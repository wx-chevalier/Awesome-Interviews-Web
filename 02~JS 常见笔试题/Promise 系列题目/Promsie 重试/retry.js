async function retry(fn, times, delay) {
  // 依次执行，记录异常
  let lastError;

  for (const i of times) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // 判断是否为最后一次，如果不是最后一次则等待 delay 毫秒
      if (i !== times.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
}
