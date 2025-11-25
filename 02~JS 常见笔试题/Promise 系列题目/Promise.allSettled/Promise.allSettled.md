```js
function promiseAllSettled(promises) {
  // Your code here
}

// 测试用例
const p1 = Promise.resolve(1);
const p2 = Promise.reject(new Error("fail"));
const p3 = Promise.resolve(3);

promiseAllSettled([p1, p2, p3]).then((results) => {
  console.log(results);
  // 期望输出:
  // [
  //   { status: 'fulfilled', value: 1 },
  //   { status: 'rejected', reason: Error: fail },
  //   { status: 'fulfilled', value: 3 }
  // ]
});

function promiseAllSettled(promises) {
  // 边界检查
  if (typeof promises[Symbol.iterator] !== "function") {
    return Promise.reject(new TypeError("Argument is not iterable"));
  }
  const promisesArray = Array.from(promises);
  if (promisesArray.length === 0) {
    return Promise.resolve([]);
  }

  let settledCount = 0;
  const results = new Array(promisesArray.length);

  return new Promise((resolve) => {
    promisesArray.forEach((promise, index) => {
      // 关键：用 Promise.resolve 包装，确保非 Promise 值也能被处理
      Promise.resolve(promise)
        .then((value) => {
          results[index] = { status: "fulfilled", value };
        })
        .catch((reason) => {
          results[index] = { status: "rejected", reason };
        })
        .finally(() => {
          settledCount++;
          if (settledCount === promisesArray.length) {
            resolve(results);
          }
        });
    });
  });
}
```
