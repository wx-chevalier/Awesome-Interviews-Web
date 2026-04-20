function promiseLimit(tasks, limit) {
  // Your code here
  return new Promise((resolve, reject) => {
    if (tasks.length === 0) {
      resolve([]);
      return;
    }
  });
}
