const queue = [];

function progress() {
  console.log("resolve", queue);
}

function addPromise() {
  let fn;
  const p = new Promise((resolve, reject) => {
    fn = resolve;
  }).then(() => {
    progress();
  });
  queue.push(p);
  console.log(queue);
  return fn;
}

function loaded() {
  return Promise.all(queue);
}

export { addPromise, loaded };
