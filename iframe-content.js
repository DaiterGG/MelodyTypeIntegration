class IframeStyleReceiver {
  constructor() {
    this.styleCache = new Map();
    this.initMessageHandler();
  }

  initMessageHandler() {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'STYLE_LOAD') {
        const imgs = document.querySelectorAll('img');

        const existingCanvases = document.querySelectorAll('.tinted-canvas');
        existingCanvases.forEach(canvas => canvas.remove());

        imgs.forEach(img => {
          if (img.complete) {
            applyTint(img);
          } else {
            img.onload = () => applyTint(img);
          }
        });
      }
      if (event.data.type === 'STYLE_UPDATE') {
        this.applyStyles(event.data.selector, event.data.styles);
      }
      if (event.data.type === 'CSS_VARS_UPDATE') {
        this.applyCSSVariables(event.data.selector, event.data.variables);
      }
    });
  }

  applyCSSVariables(selector, variables) {
    const root = document.querySelector(selector);
    if (!root) return;
    Object.entries(variables).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }

  applyStyles(selector, styles) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      Object.assign(element.style, styles);
      this.styleCache.set(selector, styles);
    });
  }
}

function applyTint(img) {
  img.style.display = 'block';

  const canvas = document.createElement('canvas');
  canvas.className = 'tinted-canvas';
  canvas.width = img.clientWidth;
  canvas.height = img.clientHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = 'source-atop';
  const style = window.getComputedStyle(document.body);
  if ( img.clientWidth == '20' ) {
    ctx.fillStyle = style.getPropertyValue('--main-color');
  } else {
    ctx.fillStyle = style.getPropertyValue('--sub-color');
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = 'source-over';
  img.parentNode.insertBefore(canvas, img);
  img.style.display = 'none';
}

const styleReceiver = new IframeStyleReceiver();

new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        styleReceiver.styleCache.forEach((styles, selector) => {
          if (node.matches(selector)) {
            Object.assign(node.style, styles);
          }
        });
      }
    });
  });
}).observe(document.body, {
  childList: true,
  subtree: true
});

(function() {
  const cssFileUrl = chrome.runtime.getURL('iframe-styles.css');

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = cssFileUrl;
  link.id = 'embedded-overflow-fix';

  if (document.head) {
    document.head.appendChild(link);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.head.appendChild(link);
    });
  }
})();
