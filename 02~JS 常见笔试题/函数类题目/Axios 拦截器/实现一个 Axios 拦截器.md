### 一、核心设计思想：拦截器是什么？

想象一下，一个 HTTP 请求的生命周期就像一条流水线：
`发起请求` -> `处理请求配置` -> `发送网络请求` -> `接收服务器响应` -> `处理响应数据` -> `返回最终结果`
拦截器就像是插在这条流水线特定位置的“检查站”或“加工站”。

- **请求拦截器**：插在`发送网络请求`之前。可以用来统一添加 token、修改请求头、上报请求日志等。
- **响应拦截器**：插在`接收服务器响应`之后。可以用来统一处理错误、根据状态码跳转、对响应数据做格式化等。
  Axios 的精髓在于，它用 **Promise 链** 巧妙地将这些“检查站”串联了起来。

---

### 二、核心组件拆解

要实现拦截器，我们需要两个核心组件：

1.  **`InterceptorManager` (拦截器管理器)**：负责管理（添加、移除）所有的拦截器。
2.  **`Axios.prototype.request` (请求方法)**：负责将拦截器和核心请求函数 `dispatchRequest` 串联成一个 Promise 链。

---

### 三、迷你版 Axios 源码实现

下面这个代码块就是一个功能完备的迷你版 Axios，它实现了请求和响应拦截器的核心逻辑。请仔细阅读注释，这是理解的关键。

```javascript
// ------------------- 1. 拦截器管理器 -------------------
class InterceptorManager {
  constructor() {
    this.handlers = []; // 存储所有拦截器
  }
  // 添加拦截器，返回一个 ID 用于后续移除
  use(fulfilled, rejected) {
    this.handlers.push({
      fulfilled: fulfilled,
      rejected: rejected,
    });
    return this.handlers.length - 1; // 返回 ID
  }
  // 移除指定 ID 的拦截器
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  // 遍历所有拦截器
  forEach(fn) {
    this.handlers.forEach((handler) => {
      if (handler !== null) {
        fn(handler);
      }
    });
  }
}
// ------------------- 2. 核心请求函数 -------------------
// 这是真正发送请求的函数（这里用 setTimeout 模拟异步）
function dispatchRequest(config) {
  return new Promise((resolve, reject) => {
    console.log(
      `[dispatchRequest] 发送请求到: ${config.url}, 数据:`,
      config.data
    );
    setTimeout(() => {
      // 模拟成功响应
      if (config.url.endsWith("/success")) {
        resolve({ status: 200, data: `Response from ${config.url}` });
      } else {
        // 模拟失败响应
        reject(new Error(`Request failed for ${config.url}`));
      }
    }, 1000);
  });
}
// ------------------- 3. Axios 构造函数 -------------------
class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig;
    // 实例化请求和响应的拦截器管理器
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager(),
    };
  }
  // 核心请求方法，所有 axios.get/post 等最终都会调用这里
  request(config) {
    // 合并默认配置和用户传入的配置
    config = { ...this.defaults, ...config };
    // *** 核心：构建 Promise 链 ***
    // chain 数组是关键！它存储了所有需要串联的函数
    // 初始时，链中只有核心请求函数和一个 undefined（因为 dispatchRequest 没有 rejected handler）
    let chain = [dispatchRequest, undefined];
    // 1. 遍历并添加**响应拦截器**到链的尾部
    // 注意：这里是 forEach，所以先添加的拦截器在链的更前面
    this.interceptors.response.forEach((interceptor) => {
      chain.push(interceptor.fulfilled, interceptor.rejected);
    });
    // 2. 遍历并添加**请求拦截器**到链的头部
    // 注意：这里是反向遍历！因为我们要保证先添加的拦截器后执行
    // 执行顺序：interceptor1 -> interceptor2 -> dispatchRequest
    // 构建链的顺序：需要把 interceptor2 放在链的前面
    let requestInterceptors = this.interceptors.request;
    for (let i = requestInterceptors.handlers.length - 1; i >= 0; i--) {
      const interceptor = requestInterceptors.handlers[i];
      if (interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      }
    }
    // 3. 创建一个 Promise，并启动这个链
    let promise = Promise.resolve(config);
    // 4. 循环执行链中的函数
    while (chain.length > 0) {
      // 每次从链头取出两个函数（fulfilled, rejected）
      // 并将它们注册到 promise 的 then 方法上
      promise = promise.then(chain.shift(), chain.shift());
    }
    // 5. 返回最终的 Promise
    return promise;
  }
}
// ------------------- 4. 使用示例 -------------------
// 创建一个 axios 实例
const axios = new Axios({ timeout: 5000 });
// 添加一个请求拦截器
const requestInterceptorId = axios.interceptors.request.use(
  (config) => {
    console.log("[Request Interceptor 1] 准备发送请求，添加 token");
    config.headers = { ...config.headers, Authorization: "Bearer my-token" };
    return config;
  },
  (error) => {
    console.error("[Request Interceptor 1] 请求配置出错", error);
    return Promise.reject(error);
  }
);
// 添加第二个请求拦截器
axios.interceptors.request.use(
  (config) => {
    console.log("[Request Interceptor 2] 修改请求数据");
    config.data = { ...config.data, extra: "data" };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// 添加一个响应拦截器
axios.interceptors.response.use(
  (response) => {
    console.log("[Response Interceptor 1] 收到响应，状态码:", response.status);
    response.data = response.data + " [processed]";
    return response;
  },
  (error) => {
    console.error("[Response Interceptor 1] 响应出错", error.message);
    return Promise.reject(error);
  }
);
// --- 发送请求 ---
console.log("--- 发送一个成功的请求 ---");
axios({
  method: "get",
  url: "/api/user/success",
  data: { name: "zhangsan" },
})
  .then((response) => {
    console.log("最终成功结果:", response.data);
  })
  .catch((error) => {
    console.error("最终失败结果:", error.message);
  });
console.log("\n--- 发送一个失败的请求 ---");
axios({
  method: "get",
  url: "/api/user/fail", // 这个 URL 会被我们模拟为失败
})
  .then((response) => {
    console.log("最终成功结果:", response.data);
  })
  .catch((error) => {
    console.error("最终失败结果:", error.message);
  });
```

---

### 四、深度解析与设计思想

#### 1. 为什么用 `chain` 数组？

`chain` 数组是整个设计的灵魂。它将一个复杂的异步流程，变成了一个线性的、可预测的数组操作。

- **初始状态**: `[dispatchRequest, undefined]`。`dispatchRequest` 是核心请求函数，它返回一个 Promise。`undefined` 是因为它没有 `rejected` 处理函数。
- **添加响应拦截器**: `chain.push(...)`。响应拦截器在请求返回后执行，所以它们被添加到链的末尾。
- **添加请求拦截器**: `chain.unshift(...)`。这是最巧妙的地方！**必须反向遍历请求拦截器**，才能保证它们按照添加的顺序执行。
  - 假设先添加 `interceptor1`，后添加 `interceptor2`。
  - 我们希望的执行顺序是：`interceptor1` -> `interceptor2` -> `dispatchRequest`。
  - Promise 链的执行顺序是 `p.then(f1).then(f2)`，所以 `f1` 必须在 `f2` 之前。
  - 因此，构建 `chain` 时，必须先把 `interceptor2` 放在 `chain` 的前面，再把 `interceptor1` 放在更前面。反向遍历正好实现了这一点。

#### 2. `promise.then(chain.shift(), chain.shift())` 的魔力

这行代码是驱动整个链条的引擎。

- `promise.then(...)`：将下一个处理函数（成功和失败）注册到当前的 Promise 上。
- `chain.shift()`：从数组头部取出一个函数。
- 每次循环，`promise` 变量都会被更新为上一个 `then` 调用返回的新 Promise。
- 这样，通过一个简单的 `while` 循环，就完美地构建了一个长长的、按顺序执行的 Promise 链。

#### 3. 错误处理机制

Promise 链的错误处理是“冒泡”的。如果任何一个请求拦截器的 `fulfilled` 函数抛出错误，或者 `rejected` 函数被调用，那么这个错误会直接跳过后续的请求拦截器和 `dispatchRequest`，进入第一个响应拦截器的 `rejected` 处理函数。

```javascript
// 请求拦截器A
(config) => {
  throw new Error("Request config error!");
}, // 抛出错误
  // 请求拦截器B (不会执行)
  // dispatchRequest (不会执行)
  // 响应拦截器A (rejected)
  (error) => {
    console.log("Caught by response interceptor A:", error.message);
    return Promise.reject(error);
  },
  // 响应拦截器B (rejected)
  (error) => {
    console.log("Caught by response interceptor B:", error.message);
  };
```

## 这种设计非常强大，允许你在任何阶段捕获和处理错误。

### 五、与真实源码的对比

我们这个迷你版本已经抓住了 Axios 拦截器 90% 的核心思想。真实的 Axios 源码 (`lib/core/Axios.js`) 在此基础上增加了：

1.  **更完善的配置合并**：有专门的 `mergeConfig` 函数来深度合并默认配置、实例配置和请求配置。
2.  **取消请求功能**：通过 `CancelToken` 实现，它也是通过在 `dispatchRequest` 中检查配置来实现的。
3.  **更多的辅助方法**：如 `axios.get`, `axios.post` 等，它们本质上都是对 `axios.request` 方法的封装，简化了调用。
4.  **更健壮的类型定义**：使用 TypeScript 或 Flow 进行了严格的类型约束。
    通过理解这个迷你版，你已经掌握了 Axios 最精髓的设计模式。再去阅读真实源码时，你会发现思路是完全一致的，只是细节更丰富而已。

---
