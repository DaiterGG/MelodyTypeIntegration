class IframeStyleReceiver {
  constructor() {
    this.styleCache = new Map();
    this.initMessageHandler();
  }

  initMessageHandler() {
    window.addEventListener('message', (event) => {
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

//edited
class EmbedStyleOverrider {
  constructor(config) {
    this.styleConfig = new Map(config);
    this.observer = null;
    this.init();
  }

  init() {
    // Initial application
    this.applyAllStyles();
    
    // Set up mutation observer
    this.setupObserver();
    
    // Periodic check as fallback
    this.setupHeartbeat();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          this.handleDOMChanges(mutation.addedNodes);
        }
      });
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  handleDOMChanges(nodes) {
    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        this.applyAllStyles(node);
      }
    });
  }

  applyAllStyles(root = document) {
    this.styleConfig.forEach((styles, selector) => {
      this.applyStylesToElements(root, selector, styles);
    });
  }

  applyStylesToElements(root, selector, styles) {
    const elements = root.querySelectorAll(selector);
    elements.forEach(element => {
      // Merge with existing styles instead of overwriting
      Object.assign(element.style, styles);
    });
  }

  addStyleOverride(selector, styles) {
    this.styleConfig.set(selector, styles);
    this.applyStylesToElements(document, selector, styles);
  }

  removeStyleOverride(selector) {
    this.styleConfig.delete(selector);
  }

  setupHeartbeat() {
    setInterval(() => {
      this.applyAllStyles();
    }, 3000);
  }
}

// Configuration: [selector, styles] pairs
const styleOverrides = [
  ['.linkBox > form', {
    'margin-top': '30px'
  }],
  ['#app > header', {
    'height': '50px'
  }],
  ['#typing-area', {
    'padding-top': '0px'
  }],
  ['#skip-btn', {
    'top': '70px'
  }],
  ['.settings-gear-btn', {
    'top': '82%'
  }],
  ['body', {
    'overflow':'hidden !important',
    'height': '100% !important'
  }],
  ['#wrapper', {
    'padding-top': '-40px'
  }],
];

// Initialize with configuration
const styleOverrider = new EmbedStyleOverrider(styleOverrides);

// Optional: Add new overrides dynamically
// styleOverrider.addStyleOverride('.new-element', { color: 'blue' });

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
