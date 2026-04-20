## 好的，这是一个非常经典且具有深度的 Promise 应用题，它完美地结合了异步编程、闭包和缓存设计，非常适合用来考察 2-2 级别候选人的工程能力。

### **题目：实现一个支持缓存的高阶函数**

请实现一个 `memoizePromise` 函数。它接收一个返回 Promise 的异步函数 `fn` 作为参数，返回一个新的函数 `memoizedFn`。
`memoizedFn` 的功能如下：

1.  当 `memoizedFn` 被调用时，如果这是第一次以该参数调用，则执行 `fn`，并将返回的 Promise 缓存起来。
2.  如果后续以**相同参数**调用 `memoizedFn`，则**不会重新执行 `fn`**，而是直接返回第一次调用时缓存的那个 Promise。
3.  这个缓存需要能正确处理并发调用。即，如果在第一次调用还未完成时，又发起了第二次相同参数的调用，也应该共享同一个 Promise，而不是发起新的请求。

```javascript
// 请实现这个函数
function memoizePromise(fn) {
  // Your code here
}
// ------------------- 测试用例 -------------------
// 模拟一个异步请求函数
let requestCount = 0;
const fetchData = (id) => {
  requestCount++;
  console.log(`--- [Request] 发起请求 #${requestCount} for id: ${id} ---`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id, data: `Data for ${id}` });
    }, 1000);
  });
};
const memoizedFetchData = memoizePromise(fetchData);
// 场景 1: 基本缓存
console.log("场景 1: 基本缓存");
memoizedFetchData(1).then((res) => console.log("结果 1:", res));
setTimeout(() => {
  memoizedFetchData(1).then((res) => console.log("结果 2 (应来自缓存):", res));
}, 500);
// 场景 2: 并发调用
setTimeout(() => {
  console.log("\n场景 2: 并发调用");
  memoizedFetchData(2).then((res) => console.log("并发结果 1:", res));
  memoizedFetchData(2).then((res) =>
    console.log("并发结果 2 (应共享请求):", res)
  );
  memoizedFetchData(2).then((res) =>
    console.log("并发结果 3 (应共享请求):", res)
  );
}, 2000);
// 场景 3: 不同参数
setTimeout(() => {
  console.log("\n场景 3: 不同参数");
  memoizedFetchData(3).then((res) => console.log("结果 3:", res));
  memoizedFetchData(1).then((res) => console.log("结果 4 (应来自缓存):", res));
}, 4000);
// 期望输出:
// 场景 1: 基本缓存
// --- [Request] 发起请求 #1 for id: 1 ---
// (1秒后)
// 结果 1: { id: 1, data: 'Data for 1' }
// 结果 2 (应来自缓存): { id: 1, data: 'Data for 1' }
//
// 场景 2: 并发调用
// --- [Request] 发起请求 #2 for id: 2 ---
// (1秒后)
// 并发结果 1: { id: 2, data: 'Data for 2' }
// 并发结果 2 (应共享请求): { id: 2, data: 'Data for 2' }
// 并发结果 3 (应共享请求): { id: 2, data: 'Data for 2' }
//
// 场景 3: 不同参数
// --- [Request] 发起请求 #3 for id: 3 ---
// --- [Request] 发起请求 #4 for id: 1 ---  // 注意：这里不应该有新请求，因为 id=1 已缓存
// (1秒后)
// 结果 3: { id: 3, data: 'Data for 3' }
// 结果 4 (应来自缓存): { id: 1, data: 'Data for 1' }
```

---

### **高质量实现**

```javascript
function memoizePromise(fn) {
  // 使用 Map 作为缓存容器，Key 是参数，Value 是 Promise
  const cache = new Map();
  return function (...args) {
    // 1. 生成缓存 Key
    // 对于简单场景，可以直接用 JSON.stringify
    // 对于复杂场景（如包含函数、Symbol、循环引用），需要一个更健壮的 key 生成器
    const key = JSON.stringify(args);
    // 2. 检查缓存
    if (cache.has(key)) {
      // 如果缓存中已有，直接返回缓存的 Promise
      // 所有并发调用都会得到同一个 Promise 对象
      return cache.get(key);
    }
    // 3. 如果缓存中没有，执行函数并缓存 Promise
    const promise = fn.apply(this, args).finally(() => {
      // 可选：如果需要，可以在 Promise 完成后进行某些操作
      // 比如记录日志，或者在特定条件下清除缓存
    });

    // 关键：在执行 fn 的同时，立刻将 Promise 存入缓存
    // 这样可以防止并发调用时重复执行 fn
    cache.set(key, promise);
    return promise;
  };
}
```

---

### **深度解析**

#### 1. 核心设计思想：记忆化

这个函数的本质是**记忆化**模式在异步编程中的应用。传统的记忆化缓存的是函数的**返回值**，而这里的 `memoizePromise` 缓存的是函数返回的 **Promise 对象**。
**为什么缓存 Promise 对象是关键？**
因为 Promise 对象代表了**一个异步操作的“未来”**。一旦你有了这个 Promise 对象，你就可以通过 `.then()` 或 `.await` 来获取它的最终结果，无论这个操作是正在进行中、已经成功还是已经失败。
通过缓存 Promise 对象本身，我们确保了：

- **共享状态**：所有使用相同参数的调用者都共享了同一个异步操作的状态。
- **防止重复执行**：当第一个调用者执行 `fn` 并将返回的 Promise 存入缓存后，后续的调用者会直接拿到这个 Promise，而不会再次执行 `fn`。

#### 2. 并发控制的核心：`if (cache.has(key))`

这是整个实现中最精妙的一行代码，它完美地解决了并发问题。
设想一下时间线：

1.  **T1**: `memoizedFetchData(2)` 第一次调用。`cache.has('["2"]')` 为 `false`。
2.  **T2**: 它开始执行 `const promise = fn(...)`，发起了一个网络请求。**注意：此时 `promise` 处于 `pending` 状态**。
3.  **T3**: `cache.set('["2"]', promise)` 执行，缓存了这个 `pending` 状态的 Promise。
4.  **T4**: 在网络请求还没返回时，`memoizedFetchData(2)` 第二次调用。
5.  **T5**: `cache.has('["2"]')` 为 `true`！
6.  **T6**: 第二次调用直接返回了 `cache.get('["2"]')`，也就是在 T3 时存入的那个 `pending` 状态的 Promise。
    两次调用最终都指向了同一个 Promise 对象，当网络请求返回时，这个 Promise 的状态变为 `fulfilled`，两个调用者的 `.then()` 回调都会被触发。这样就实现了请求的共享。

#### 3. 缓存 Key 的生成

- **`JSON.stringify(args)`**：这是最简单直接的方法，对于大多数基本类型和普通对象都有效。
- **局限性**：
  - 无法处理 `undefined`、`Symbol`、函数。
  - 对象属性顺序不同会导致 key 不同（`{a:1,b:2}` 和 `{b:2,a:1}`）。
  - 存在循环引用时会报错。
- **追问**：如果面试官指出 `JSON.stringify` 的局限性，你可以讨论如何实现一个更健壮的 key 生成器，或者使用第三方库（如 `lodash.memoize` 的 resolver）。

#### 4. 错误处理

## 这个实现也自然地处理了错误情况。如果 `fn` 返回的 Promise 被 `reject`，那么这个被拒绝的 Promise 也会被缓存。后续的调用会得到这个被拒绝的 Promise，从而触发 `.catch()` 或 `try/catch`。这通常是期望的行为，因为它避免了对一个已知失败的接口反复重试。

### **追问与扩展**

1.  **如何实现缓存清除功能？**

    - **思路**：返回一个对象，不仅包含 `memoizedFn`，还包含一个 `clear` 方法。`clear` 方法可以清空整个 `cache`，或者接受一个 key 来清除特定的缓存。
    - **实现**:

      ```javascript
      function memoizePromise(fn) {
        const cache = new Map();
        const memoizedFn = function (...args) {
          /* ... */
        };

        memoizedFn.clear = (key) => {
          if (key) {
            cache.delete(key);
          } else {
            cache.clear();
          }
        };
        return memoizedFn;
      }
      ```

2.  **如何实现带 TTL (Time-To-Live) 的缓存？**
    - **思路**：在 `cache.set(key, promise)` 的同时，启动一个 `setTimeout`，在指定时间后自动 `cache.delete(key)`。
    - **挑战**：如何管理大量的定时器？需要考虑性能和内存问题。
3.  **如果缓存无限增长，如何避免内存泄漏？**
    - **思路**：实现一个 LRU (Least Recently Used) 缓存。当缓存数量超过限制时，自动移除最久未使用的缓存项。这需要额外的数据结构（如双向链表）来记录访问顺序。
4.  **这个实现有什么潜在的问题？**
    - **内存**：如果 key 的可能性非常多且永不重复，缓存会无限增长，导致内存泄漏。
    - **缓存失效**：在某些场景下，服务端的数据更新了，但客户端仍在使用旧缓存。如何主动让缓存失效？这可能需要配合服务端推送或其他机制。

---
