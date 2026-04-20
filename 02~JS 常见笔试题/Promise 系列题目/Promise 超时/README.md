# Promise 超时

请实现一个 pTimeout 函数，它接收一个 Promise 和一个超时时间 ms。如果原 Promise 在 ms 内完成，则返回其结果；否则，返回一个 reject 的 Promise。

```js
function pTimeout(promise, ms, timeoutError = new Error("Promise timed out")) {
  // Your code here
}

// 测试用例
const p = new Promise((resolve) => setTimeout(() => resolve("Success!"), 2000));

pTimeout(p, 1000).catch((err) => console.log(err.message)); // 输出: Promise timed out
pTimeout(p, 3000).then((res) => console.log(res)); // 输出: Success!
```

```js
function pTimeout(promise, ms, timeoutError = new Error("Promise timed out")) {
  // 创建一个在 ms 后 reject 的超时 Promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(timeoutError);
    }, ms);
  });

  // 使用 Promise.race 来竞争
  return Promise.race([promise, timeoutPromise]);
}
```

深度解析:

- **核心思想**: 利用 `Promise.race` 的“竞速”特性。`Promise.race` 接受一个 Promise 数组，并返回一个新的 Promise，这个新 Promise 的结果由数组中**最先完成**的那个 Promise 决定。

- 关键实现:

  1. 创建一个“超时 Promise”，它在指定时间后 `reject`。
  2. 将原始的 `promise` 和这个“超时 Promise”一起放入 `Promise.race`。
  3. 如果原始 `promise` 先完成，`race` 的结果就是它的 `fulfilled` 值。
  4. 如果“超时 Promise”先完成，`race` 的结果就是它的 `rejected` 值，从而实现了超时控制。

- **考点**: `Promise.race` 的巧妙应用、组合式编程思维。
