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
    }, 7000);
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

    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && (rule.selectorText.includes(':root') || rule.selectorText.includes('#words'))) {
            for (const property of rule.style) {
              if (property.startsWith('--')) {
                customProperties[property] = rule.style.getPropertyValue(property).trim();
              }
            }
          }
        }
      } catch (e) {
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

  const row = document.querySelector('.row');
  const customText = row.querySelector('.mode');
  const originalButton = customText.querySelector('.textButton');


  const clonedButton = originalButton.cloneNode(true);
  clonedButton.className = 'textButton MyButton';
  clonedButton.id = 'new-button';


  const icon = clonedButton.querySelector('i');
  icon.className = 'fas fa-star';

  const textNode = document.createTextNode(' melody ');
  clonedButton.textContent = '';
  clonedButton.appendChild(icon);
  clonedButton.appendChild(textNode);
  customText.appendChild(clonedButton);

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
