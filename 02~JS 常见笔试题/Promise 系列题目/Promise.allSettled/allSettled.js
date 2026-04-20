function promiseAllSettled(promises) {
  const promisesArray = Array.from(promises);
  if (promisesArray.length === 0) {
    return Promise.resolve([]);
  }

  let allSettledNum = 0;
  const results = new Array(promisesArray.length);

  return new Promise((resolve, reject) => {
    for (const promise of promisesArray) {
      Promise.resolve(promise)
        .then((result) => {
          results[allSettledNum] = {
            status: "fulfilled",
            value: result,
          };
        })
        .catch((error) => {
          results[allSettledNum] = {
            status: "rejected",
            reason: error,
          };
        })
        .finally(() => {
          allSettledNum++;
          if (allSettledNum === promisesArray.length) {
            resolve(results);
          }
        });
    }
  });
}
