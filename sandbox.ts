const srcdoc = (origin: string, senderId: string, receiverId: string) =>
  `<!doctype html>
<html>
<body>
<script>
delete window.fetch;
delete window.XMLHttpRequest;
const origin = "${origin}";
const senderId = "${senderId}";
const receiverId = "${receiverId}";
const handleMessage = (event) => {
  if (event.source !== window.parent) {
    return;
  }
  if (event.origin !== origin) {
    return;
  }
  const { id, src, scope } = event.data || {};
  if (id !== receiverId) {
    return;
  }
  try {
    const result =
      new Function(...Object.keys(scope), '"use strict";' + src)(...Object.values(scope));
    window.parent.postMessage({ id: senderId, result }, origin);
  } catch (error) {
    window.parent.postMessage({ id: senderId, error }, origin);
  }
  window.removeEventListener("message", handleMessage);
};
window.addEventListener("message", handleMessage);
window.parent.postMessage({ id: senderId, ready: true }, origin);
</script>
</body>
</html>`;

export class Sandbox {
  #iframe: HTMLIFrameElement;
  #senderId: string;
  #receiverId: string;
  #scope: any;

  exports = {};

  constructor(src: string, scope: any) {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("style", "display: none");
    this.#iframe = iframe;

    this.#senderId = crypto.randomUUID();
    this.#receiverId = crypto.randomUUID();

    this.#scope = structuredClone(scope);

    addEventListener("message", this.#handleMessage);
    this.#iframe.srcdoc = srcdoc(
      location.origin,
      this.#senderId,
      this.#receiverId
    );
    document.body.appendChild(this.#iframe);
  }

  #handleMessage(event: MessageEvent) {
    if (event.source !== this.#iframe.contentWindow) {
      return;
    }
    const { id, result, error, ready } = event.data ?? {};
    if (id !== this.#senderId) {
      return;
    }
    if (ready) {
      this.#iframe.contentWindow?.postMessage(
        { id: this.#receiverId, src, scope },
        "*"
      );
      return;
    }
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  }

  close() {
    removeEventListener("message", this.#handleMessage);
    document.body.removeChild(this.#iframe);
  }
}
