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
          console.log(existingCanvases);
          for (let i = 0; i < existingCanvases.length; i++) {
            existingCanvases[i].remove();
          }

          imgs.forEach(img => {
            function applyTint() {

              img.style.display = 'block';

              const canvas = document.createElement('canvas');
                canvas.className = 'tinted-canvas';
              
              canvas.width = img.clientWidth;
              canvas.height = img.clientHeight;
              
              const ctx = canvas.getContext('2d');

              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              ctx.globalCompositeOperation = 'source-atop';

              var style = window.getComputedStyle(document.body);
              ctx.fillStyle = style.getPropertyValue('--sub-color');

              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // Reset composite operation if further drawing is needed
              ctx.globalCompositeOperation = 'source-over';

              // Insert the canvas into the DOM (and optionally hide the original image)
              img.parentNode.insertBefore(canvas, img);
              img.style.display = 'none';
            }
          // Ensure the image is fully loaded before processing
          if (img.complete) {
            applyTint();
          } else {
            img.onload = applyTint;
          }
        })
      }
      if (event.data.type === 'STYLE_UPDATE') {
        this.applyStyles(
          event.data.selector,
          event.data.styles
        );
      }
      if (event.data.type === 'CSS_VARS_UPDATE') {
        this.applyCSSVariables(
          event.data.selector,
          event.data.variables
        );
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

  // Permanent base variable application
  applyStyles(selector, styles) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      Object.assign(element.style, styles);
      
      // Optional: Store last known styles
      this.styleCache.set(selector, styles);
    });
  }

  // Optional: Reapply cached styles to new elements
  reapplyCachedStyles(selector) {
    if (this.styleCache.has(selector)) {
      this.applyStyles(selector, this.styleCache.get(selector));
    }
  }
}

// Initialize receiver
const styleReceiver = new IframeStyleReceiver();

// Optional: Watch for new elements in iframe
new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) { // Element node
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
  // Get the URL of the CSS file
  const cssFileUrl = chrome.runtime.getURL('iframe-styles.css');

  // Create a link element
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = cssFileUrl;
  link.id = 'embedded-overflow-fix';

  // Apply immediately if possible
  if (document.head) {
    document.head.appendChild(link);
  } else {
    // Wait for DOM readiness if needed
    document.addEventListener('DOMContentLoaded', () => {
      document.head.appendChild(link);
    });
  }

  // Permanent enforcement
  new MutationObserver(() => {
    if (!document.getElementById('embedded-overflow-fix')) {
      const newLink = link.cloneNode(true);
      document.head.appendChild(newLink);
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
