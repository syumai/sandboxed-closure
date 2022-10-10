type Sandbox = any;
const createSandbox: any = () => {};

async () => {
  const src = `
    let result = initialValue;
    const increment = () => { return result++; };
    addExports("result", () => result);
    addExports("increment", () => increment);
  `;

  const sandbox: Sandbox = await createSandbox(src, {
    initialValue: 1,
  });

  console.log(await sandbox.exports.increment()); // 2
  console.log(await sandbox.exports.increment()); // 3
  console.log(sandbox.exports.result); // 3
};

const initialValue = 1;
const registerExportToParent = (name) => {
  window.parent.postMessage({
    messageType: "registerExport",
    name,
    senderId,
  });
};

const addExports = (name, valueFn) => {
  registerExportToParent(name);
  window.addEventListener("message", (e: MessageEvent) => {
    if (e.data.messageType !== "getExport") {
      return;
    }
    if (e.data.name !== name) {
      return;
    }
    let value = valueFn();
    if (typeof value === "function") {
    }
  });
};
let result = initialValue;
const increment = () => {
  return result++;
};
addExports("result", () => result);
addExports("increment", () => increment);
