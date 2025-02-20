class FrameManager {
  constructor() {
    this.iframe = null;
    this.init();
  }

  init() {
    this.createIframe();
    this.setupLoadListener();
    setInterval(() => {
      this.syncRootVariables();
    }, 3000);
  }

  createIframe() {
    this.iframe = document.createElement('iframe');
    this.iframe.src = 'https://melodytype.com';
    this.iframe.allow = 'autoplay; encrypted-media';
    this.iframe.id = 'melodytype-embed';
    document.body.appendChild(this.iframe);
    this.HideIframe(true);
  }

  HideIframe(hide) {
    if ( hide ){
      this.iframe.style.display = 'none';
    } else {
      this.iframe.style.display = 'block';
    }
  }
  setupLoadListener() {
    if (!this.iframe) {
      console.error('Iframe not initialized!');
      return;
    }

    this.iframe.addEventListener('load', () => {
      this.syncRootVariables();
    });
  }

  syncRootVariables() {
    const root = document.documentElement;
    const styles = getComputedStyle(root);

  const customProperties = {};

  // Loop through all stylesheets in the document.
  for (const sheet of document.styleSheets) {
    try {
      // Loop through each CSS rule in the stylesheet.
      for (const rule of sheet.cssRules) {
        // Check if the rule applies to the root element.
        if (rule.selectorText && (rule.selectorText.includes(':root') || rule.selectorText.includes('#words'))) {
          // Loop through each property in the rule's style.
          for (const property of rule.style) {
            if (property.startsWith('--')) {
              customProperties[property] = rule.style.getPropertyValue(property).trim();
            }
          }
        }
      }
    } catch (e) {
      // Accessing cross-origin stylesheets can throw a SecurityError.
      console.warn(`Cannot access stylesheet: ${sheet.href}`, e);
    }
  }


    this.postToFrame({
      type: 'CSS_VARS_UPDATE',
      selector: ':root',
      variables: customProperties
    });
  }

  postToFrame(message) {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(message, '*');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  const frameManager = new FrameManager();
  // Select the row container
  const row = document.querySelector('.row');
  const originalButton = document.querySelector('.textButton');

  const customText = row.querySelector('.mode');

  const clonedButton = originalButton.cloneNode(true);
  clonedButton.className = 'textButton MyButton';
  clonedButton.id = 'new-button';


  const iconDiv = clonedButton.querySelector('div');
  const icon = iconDiv.querySelector('i');
  icon.className = 'fas fa-star';
  const textNode = document.createTextNode(' melody ');
  clonedButton.appendChild(textNode);
  customText.appendChild(clonedButton);

  // Function to run when the new button is clicked
  function handleNewButtonClick(e, frameManager) {
      frameManager.HideIframe(false);
      const mode = row.querySelector('.mode');
      const btns = mode.querySelectorAll('.textButton');
      btns.forEach(btn => {

          if (btn !== clonedButton){ 
             btn.className = 'textButton';
          }
      });

      const tohide = ['.puncAndNum','.customText','.quoteLength','.time','.wordCount'];
      tohide.forEach(className => {
          const element = row.querySelector(className);
              element.classList.add('hidden');
      });

      const left = row.querySelector('.leftSpacer');
      left.classList.add('scrolled');
      const right = row.querySelector('.rightSpacer');
      right.classList.add('scrolled');

      clonedButton.className = 'textButton MyButton active';


      frameManager.postToFrame({
        type: 'STYLE_LOAD',
      });
  }

  clonedButton.addEventListener('click', (e) => handleNewButtonClick(e, frameManager));

    function handleOtherButtonClick(e, frameManager) {
        frameManager.HideIframe(true);
      clonedButton.className = 'textButton MyButton';
    }

  const buttons = Array.from(row.querySelectorAll('button'));
  buttons.push( document.querySelector('.textButton.view-settings'));
  buttons.push( document.querySelector('.textButton.view-about'));
  buttons.push( document.querySelector('.textButton.view-login'));

  buttons.forEach(button => {
    if (button !== clonedButton) {
      button.addEventListener('click', (e) => handleOtherButtonClick(e, frameManager));
    }
  });
}
