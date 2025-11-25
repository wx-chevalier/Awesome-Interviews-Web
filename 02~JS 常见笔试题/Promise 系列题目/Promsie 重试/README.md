请实现一个 retry 函数，它接收一个异步函数 fn、重试次数 times 和重试间隔 delay。如果 fn 调用失败，则每隔 delay 毫秒重试一次，直到成功或达到 times 次数。

```js
function retry(fn, times, delay) {
  // Your code here
}

// 测试用例
let attempt = 0;
const failingTask = () =>
  new Promise((resolve, reject) => {
    attempt++;
    console.log(`Attempt ${attempt}`);
    if (attempt < 3) {
      reject(new Error("Failed"));
    } else {
      resolve("Success!");
    }
  });

retry(failingTask, 5, 1000).then((res) => console.log(res));
```

```js
async function retry(fn, times, delay) {
  let lastError;
  for (let i = 0; i < times; i++) {
    try {
      return await fn(); // 尝试执行
    } catch (error) {
      lastError = error;
      console.log(`Retry ${i + 1} failed.`);
      if (i < times - 1) {
        // 如果不是最后一次，则等待后重试
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  // 所有重试都失败了，抛出最后一个错误
  throw lastError;
}
```

- **核心思想**: 使用循环和 `try/catch` 来控制重试逻辑。`async/await` 的语法使得这种异步流程控制变得非常直观。

- 关键实现 :

  1. 使用 `for` 循环来控制重试次数。
  2. 在循环内部，用 `try/catch` 包裹 `await fn()` 的调用。
  3. 如果 `fn()` 成功（`try` 块中没有抛出错误），`return` 会直接终止整个 `retry` 函数并返回结果。
  4. 如果 `fn()` 失败（`catch` 块被触发），保存错误信息，如果不是最后一次尝试，则 `await` 一个 `setTimeout` 来实现延迟，然后进入下一次循环。
  5. 如果循环结束仍未成功，说明所有重试都失败了，此时 `throw` 最后一次捕获的错误。

- **考点**: `async/await` 的错误处理、循环中的异步控制、工程健壮性设计。
