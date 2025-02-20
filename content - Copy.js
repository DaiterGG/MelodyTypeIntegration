// Create and inject the iframe
const iframe = document.createElement('iframe');
iframe.id = 'melodytype-embed';
iframe.src = 'https://melodytype.com';
iframe.allow = 'autoplay; encrypted-media';
document.body.appendChild(iframe);

// Create close button
const closeButton = document.createElement('div');
closeButton.id = 'embed-close';
closeButton.innerHTML = '×';
closeButton.addEventListener('click', () => {
  iframe.style.display = 'none';
  closeButton.style.display = 'none';
});
document.body.appendChild(closeButton);

closeButton.addEventListener('click', () => {
  iframe.style.display = 'none';
  closeButton.style.display = 'none';
});

// Immediate style synchronization
const syncStyles = (targetElement) => {
  const styles = window.getComputedStyle(targetElement);
  const styleObject = {
    color: styles.color,
    fontSize: styles.fontSize,
    fontFamily: styles.fontFamily,
    fontWeight: styles.fontWeight,
    backgroundColor: styles.backgroundColor
  };

  iframe.contentWindow.postMessage({
    type: 'STYLE_UPDATE',
    styles: styleObject
  }, '*');
};

// Find and observe target element immediately
const initObserver = () => {
  const targetElement = document.querySelector('.darkMode');
  
  if (targetElement) {
    // Sync immediately on found element
    syncStyles(targetElement);
    
    // Set up mutation observer
    new MutationObserver(() => syncStyles(targetElement)).observe(targetElement, {
      attributes: true,
      attributeFilter: ['class'],
      childList: false,
      subtree: false
    });
  } else {
    // Fallback observer for dynamic elements
    new MutationObserver((_, observer) => {
      const element = document.querySelector('.darkMode');
      if (element) {
        syncStyles(element);
        observer.disconnect();
      }
    }).observe(document.body, {
      childList: true,
      subtree: true
    });
  }
};

// Initialize when iframe loads
iframe.addEventListener('load', () => {
  initObserver();
  
  // Continuous monitoring for new elements
  setInterval(initObserver, 1000);
});

// Initialize immediately if possible
initObserver();
