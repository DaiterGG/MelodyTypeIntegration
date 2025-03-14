function initMessageHandler() {
  globalThis.addEventListener("message", (event) => {
    if (event.data.type === "ICONS_UPDATE") {
      const imgs = document.querySelectorAll("img");

      const existingCanvases = document.querySelectorAll(".tinted-canvas");
      existingCanvases.forEach((canvas) => canvas.remove());
      if (imgs[0] != null && imgs[0].complete && imgs[0].style.display != "") {
        imgs.forEach((img) => {
          applyTint(img);
        });
      } else {
        //edge case for when page is still loading
        setTimeout(() => {
          const existingCanvases = document.querySelectorAll(".tinted-canvas");
          existingCanvases.forEach((canvas) => canvas.remove());
          imgs.forEach((img) => {
            applyTint(img);
          });
        }, 200);
      }
    }
    if (event.data.type === "CSS_VARS_UPDATE") {
      applyCSSVariables(event.data.selector, event.data.variables);
    }
  });
}

function applyCSSVariables(selector, variables) {
  const root = document.querySelector(selector);
  if (!root) return;
  Object.entries(variables).forEach(([name, value]) => {
    if (
      name == "--main-color" &&
      (value != root.style.getPropertyValue(name))
    ) {
      globalThis.postMessage({ type: "ICONS_UPDATE" }, "*");
    }
    root.style.setProperty(name, value);
  });
}

function applyTint(img) {
  img.style.display = "block";

  const canvas = document.createElement("canvas");
  canvas.className = "tinted-canvas";
  canvas.width = img.clientWidth;
  canvas.height = img.clientHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "source-atop";
  const style = globalThis.getComputedStyle(document.body);
  if (img.clientWidth == "20") {
    ctx.fillStyle = style.getPropertyValue("--main-color");
  } else {
    ctx.fillStyle = style.getPropertyValue("--sub-color");
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "source-over";
  img.parentNode.insertBefore(canvas, img);
  img.style.display = "none";
}
// Only execute if we're in an iframe AND parent is MonkeyType
if (
  globalThis !== globalThis.top && document.referrer.includes("monkeytype.com")
) {
  new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (
              node.className.includes("overlay") ||
              node.querySelector("#wrapper") != null ||
              node.querySelector(".linkBox") != null
            ) {
              globalThis.postMessage({ type: "ICONS_UPDATE" }, "*");
            }
          }
        });
      }
    });
  }).observe(document.body, { childList: true, subtree: true });

  (function () {
    initMessageHandler();
    const cssFileUrl = chrome.runtime.getURL("iframe-styles.css");

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = cssFileUrl;
    link.id = "embedded-overflow-fix";

    if (document.head) {
      document.head.appendChild(link);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        document.head.appendChild(link);
      });
    }
  })();
}
