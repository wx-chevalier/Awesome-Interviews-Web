# Promise 并发控制

请实现一个 promiseLimit 函数，它接收一个 Promise 生成器数组和一个并发数 limit，要求能并发执行这些 Promise，但同时运行的 Promise 数量不能超过 limit。

```js
function promiseLimit(tasks, limit) {
  // Your code here
}

// 测试用例
const createTask = (name, delay) => () =>
  new Promise((resolve) => {
    console.log(`${name} starts`);
    setTimeout(() => {
      console.log(`${name} finished`);
      resolve(name);
    }, delay);
  });

const tasks = [
  createTask("task1", 2000),
  createTask("task2", 1000),
  createTask("task3", 3000),
  createTask("task4", 500),
  createTask("task5", 1500),
];

// 最多同时执行 2 个任务
promiseLimit(tasks, 2).then((results) => {
  console.log("All tasks finished:", results);
});
```

```js
function promiseLimit(tasks, limit) {
  return new Promise((resolve, reject) => {
    if (tasks.length === 0) {
      resolve([]);
      return;
    }

    const results = [];
    let runningCount = 0;
    let taskIndex = 0;

    function run() {
      if (taskIndex >= tasks.length && runningCount === 0) {
        resolve(results);
        return;
      }

      while (runningCount < limit && taskIndex < tasks.length) {
        const task = tasks[taskIndex++];
        const currentTaskIndex = taskIndex - 1; // 保存当前任务的索引

        runningCount++;
        task()
          .then((result) => {
            results[currentTaskIndex] = result;
          })
          .catch((error) => {
            // 也可以选择 reject(error) 来中断所有任务
            results[currentTaskIndex] = { error };
          })
          .finally(() => {
            runningCount--;
            run(); // 一个任务完成，从队列中取下一个
          });
      }
    }

    run();
  });
}
```

深度解析:

- **核心思想**: 维护一个“运行池”和一个“任务队列”。当运行池未满时，从队列中取出任务执行；当任何一个任务完成时，运行池有空位，再从队列中取出下一个任务补充。

- 关键实现:

  1. **状态追踪**: `runningCount` 记录当前正在运行的 Promise 数量，`taskIndex` 指向下一个要执行的任务。
  2. **递归/循环驱动**: `run` 函数是核心驱动力。它是一个循环，不断地启动任务直到达到 `limit`。
  3. **任务完成回调**: 每个任务在 `.finally()` 中都会将 `runningCount` 减一，并**递归调用 `run()`**，以启动下一个等待中的任务。
  4. **结束条件**: 当所有任务都已被取走（`taskIndex >= tasks.length`）且所有正在运行的任务都已完成（`runningCount === 0`）时，表示所有任务都已结束，此时 `resolve` 最终结果。

- **考点**: 复杂异步流程控制、并发编程思想、递归与循环的结合。
