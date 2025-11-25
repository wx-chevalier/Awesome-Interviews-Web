# Promise 的执行顺序

请写出以下代码的输出顺序，并详细解释为什么。

```js
console.log("start");

setTimeout(() => {
  console.log("timeout");
}, 0);

Promise.resolve()
  .then(() => {
    console.log("promise1");
    return Promise.resolve();
  })
  .then(() => {
    console.log("promise2");
  });

async function foo() {
  console.log("async start");
  await bar();
  console.log("async end");
}

async function bar() {
  console.log("bar");
}

foo();

console.log("end");

/** 
start
async start
bar
end
promise1
promise2
async end
timeout
*/
```

1. 同步代码执行:

   - `console.log('start')` -> 输出 `start`。
   - `setTimeout` 回调放入**宏任务队列**。
   - `Promise.resolve().then(...)` 第一个 `.then` 回调放入**微任务队列**。
   - 调用 `foo()`，输出 `async start`。
   - 遇到 `await bar()`，先执行 `bar()` 函数，输出 `bar`。`await` 会将 `async end` 后的代码（即 `console.log('async end')`）也放入**微任务队列**。
   - `console.log('end')` -> 输出 `end`。

2. 同步代码执行完毕，开始清空微任务队列：

   - 执行 `Promise.resolve().then(...)` 的第一个回调，输出 `promise1`。它返回 `Promise.resolve()`，这个新的 Promise 会被立即 resolve，所以它的 `.then` 回调（即输出 `promise2` 的那个）也会被**立即放入微任务队列的末尾**。
   - 执行 `await bar()` 后续的代码，输出 `async end`。
   - 继续清空微任务队列，执行输出 `promise2` 的回调。

3. 微任务队列清空，执行下一个宏任务：

   - 执行 `setTimeout` 的回调，输出 `timeout`。

# 宏任务与微任务解析

好的，我们来深入且系统地解释一下 Promise 相关的宏任务与微任务。这个概念是理解现代 JavaScript 异步编程的基石，也是面试中的高频考点。

### 一、核心概念：为什么需要两种任务？

JavaScript 是单线程的，意味着一次只能做一件事。为了处理耗时操作（如网络请求、定时器）而不阻塞主线程，它使用了一个事件循环机制。
想象一下 JavaScript 主线程就像一个忙碌的厨师，他有一个任务清单。如果清单上都是“炒一个菜”（耗时任务），那他就没法接待新客人（处理用户交互）了。于是，他把“炒菜”这种耗时任务交给一个助手（浏览器/Node.js API），然后继续接待客人。
当助手炒好菜后，他不能直接把菜端给客人，而是需要把“菜炒好了，该上菜了”这个通知放在一个“待办事项”队列里。厨师忙完手头的事后，会来查看这个队列，然后依次处理。
这个“待办事项”队列，就是**任务队列**。为了更精细地控制任务的执行顺序，这个队列又被分成了两种：

1.  **宏任务队列**
2.  **微任务队列**

---

### 二、宏任务

宏任务是“宏观”的任务，可以理解为事件循环中每一次“执行”的主体。当一个宏任务执行完毕后，事件循环会检查是否有微任务需要处理。
**常见的宏任务有：**

- `script`（整体代码块）
- `setTimeout` / `setInterval`
- `setImmediate` (Node.js 环境)
- I/O 操作（如文件读写、网络请求完成）
- UI 渲染（浏览器环境）
  **执行时机**：每次从宏任务队列中取出**一个**任务来执行。

---

### 三、微任务

微任务是“微观”的任务，通常与当前宏任务的直接结果相关。它的优先级极高，可以“插队”。
**常见的微任务有：**

- `Promise.then()`, `Promise.catch()`, `Promise.finally()` 的回调
- `async/await` 中 `await` 后面的代码
- `queueMicrotask()` 方法
- `MutationObserver`（浏览器环境）
  **执行时机**：**在当前宏任务执行完毕后，下一个宏任务开始之前**，事件循环会**立即检查并清空整个微任务队列**。也就是说，只要微任务队列里还有任务，就会一直执行，直到队列被清空。

---

### 四、核心执行流程：事件循环的精简模型

1.  从**宏任务队列**中取出一个任务（例如 `script` 代码本身）并执行。
2.  执行完毕后，**立即检查微任务队列**。
3.  如果微任务队列不为空，则**依次执行所有**微任务，直到队列被清空。
4.  （可选）执行 UI 渲染。
5.  回到步骤 1，继续从宏任务队列中取下一个任务。
    **关键点**：微任务拥有“插队”的权力。在一次宏任务执行完毕后，所有相关的微任务都会被优先处理，这保证了与当前任务相关的后续操作能够尽快完成，提高了响应性。

---

### 五、Promise 在这个模型中的位置

**Promise 的核心价值在于，它的回调（`.then`/`.catch`/`.finally`）被设计为微任务。**
**为什么这样设计？**
这保证了 Promise 的异步行为是可预测和一致的。请看下面的对比：

```javascript
// 场景一：如果没有微任务（假设 .then 是宏任务）
console.log("script start");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("script end");
// 假设 .then 是宏任务，输出可能是：
// script start
// script end
// timeout  // timeout 和 promise 的回调都在宏任务队列，谁先进入不一定
// promise
```

```javascript
// 场景二：真实世界（.then 是微任务）
console.log("script start");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("script end");
// 真实输出：
// script start
// script end
// promise   // 微任务，在 script 宏任务结束后立即执行
// timeout   // 宏任务，在微任务队列清空后执行
```

**真实世界的优势：**
`Promise.resolve().then()` 的意图是“在当前同步代码执行完毕后，尽快执行这个回调”。微任务机制完美地实现了这一点。它确保了 `promise` 的输出一定在 `script end` 之后，并且在 `timeout` 之前，因为 `timeout` 是下一个宏任务。

---

### 六、`async/await` 与微任务

`async/await` 是 Promise 的语法糖，它的行为完全基于微任务。

```javascript
async function foo() {
  console.log("async start"); // 同步
  await Promise.resolve(); // await 会暂停后面的代码执行
  console.log("async end"); // 这部分代码被放入微任务队列
}
console.log("script start");
foo();
console.log("script end");
```

**执行流程分析：**

1.  执行 `script` 宏任务。
2.  `console.log('script start')` -> 输出。
3.  调用 `foo()`，函数体开始执行。
4.  `console.log('async start')` -> 输出。
5.  遇到 `await`，它会执行右边的 `Promise.resolve()`，这个 Promise 立即 `fulfilled`。
6.  **关键**：`await` 会将 `foo` 函数中**后续的所有代码**（即 `console.log('async end')`）**打包成一个微任务**，放入微任务队列。然后 `foo` 函数本身会 `return` 一个 Promise，并退出执行栈。
7.  `console.log('script end')` -> 输出。
8.  `script` 宏任务执行完毕。
9.  检查微任务队列，发现里面有 `console.log('async end')`，执行它。
10. 微任务队列清空，事件循环继续。
    **最终输出：**

```
script start
async start
script end
async end
```

---

### 七、一个更复杂的例子

```javascript
console.log("start");
setTimeout(() => {
  console.log("timeout1");
  Promise.resolve().then(() => console.log("promise inside timeout"));
}, 0);
Promise.resolve().then(() => {
  console.log("promise1");
  setTimeout(() => console.log("timeout inside promise"), 0);
});
Promise.resolve().then(() => console.log("promise2"));
console.log("end");
```

**详细分析：**

1.  **执行 `script` 宏任务**：
    - `console.log('start')` -> 输出 `start`。
    - `setTimeout` 回调 `cb1` 放入**宏任务队列**。宏任务队列: `[cb1]`。
    - `Promise.resolve().then(cb2)` 的回调 `cb2` 放入**微任务队列**。微任务队列: `[cb2]`。
    - `Promise.resolve().then(cb3)` 的回调 `cb3` 放入**微任务队列**。微任务队列: `[cb2, cb3]`。
    - `console.log('end')` -> 输出 `end`。
2.  **`script` 宏任务结束，清空微任务队列**：
    - 取出 `cb2` 执行：`console.log('promise1')` -> 输出 `promise1`。
    - 在 `cb2` 内部，`setTimeout` 回调 `cb4` 被放入**宏任务队列**。宏任务队列: `[cb1, cb4]`。
    - 取出 `cb3` 执行：`console.log('promise2')` -> 输出 `promise2`。
    - 微任务队列清空。
3.  **取下一个宏任务**：
    - 取出 `cb1` 执行：`console.log('timeout1')` -> 输出 `timeout1`。
    - 在 `cb1` 内部，`Promise.resolve().then(cb5)` 的回调 `cb5` 被放入**微任务队列**。微任务队列: `[cb5]`。
4.  **`cb1` 宏任务结束，清空微任务队列**：
    - 取出 `cb5` 执行：`console.log('promise inside timeout')` -> 输出 `promise inside timeout`。
    - 微任务队列清空。
5.  **取下一个宏任务**： \* 取出 `cb4` 执行：`console.log('timeout inside promise')` -> 输出 `timeout inside promise`。
    **最终输出：**

```
start
end
promise1
promise2
timeout1
promise inside timeout
timeout inside promise
```

### 总结

- **宏任务**是事件循环的基本单位，一次只处理一个。
- **微任务**优先级极高，在当前宏任务结束后、下一个宏任务开始前，会**全部执行完毕**。
- **Promise 的回调是微任务**，这保证了异步代码的执行顺序是可预测的，即“尽快”执行。
- `async/await` 本质上是 Promise 和 Generator 的语法糖，`await` 后面的代码等同于 `.then` 里的代码，是微任务。
  理解了这个模型，你就能清晰地分析任何复杂的异步代码执行顺序，这也是 2-2 级别工程师必须具备的内功。
