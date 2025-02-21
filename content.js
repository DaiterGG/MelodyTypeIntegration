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
    this.iframe = document.createElement("iframe");
    this.iframe.src = "https://melodytype.com";
    this.iframe.allow = "autoplay; encrypted-media";
    this.iframe.id = "melodytype-embed";
    document.body.appendChild(this.iframe);
    this.HideIframe(true);
  }

  HideIframe(hide) {
    if (hide) {
      this.iframe.style.display = "none";
    } else {
      this.iframe.style.display = "block";
    }
  }
  setupLoadListener() {
    if (!this.iframe) {
      console.error("Iframe not initialized!");
      return;
    }

    this.iframe.addEventListener("load", () => {
      this.syncRootVariables();
    });
  }

  syncRootVariables() {
    const customProperties = {};

    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (
            rule.selectorText &&
            (rule.selectorText.includes(":root") ||
              rule.selectorText.includes("#words"))
          ) {
            for (const property of rule.style) {
              if (property.startsWith("--")) {
                customProperties[property] = rule.style.getPropertyValue(
                  property,
                ).trim();
              }
            }
          }
        }
      } catch (e) {
        console.warn(`Cannot access stylesheet: ${sheet.href}`, e);
      }
    }

    this.postToFrame({
      type: "CSS_VARS_UPDATE",
      selector: ":root",
      variables: customProperties,
    });
  }
  postToFrame(message) {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(message, "*");
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function init() {
  const frameManager = new FrameManager();

  const row = document.querySelector(".row");
  const mode = row.querySelector(".mode");
  const originalButton = mode.querySelector(".textButton");

  const clonedButton = originalButton.cloneNode(true);
  clonedButton.className = "textButton MyButton";
  clonedButton.id = "new-button";
  clonedButton.setAttribute("mode", "melody");

  const icon = clonedButton.querySelector("i");
  icon.className = "fas fa-star";

  const textNode = document.createTextNode(" melody ");
  clonedButton.textContent = "";
  clonedButton.appendChild(icon);
  clonedButton.appendChild(textNode);
  mode.appendChild(clonedButton);

  let melodyActive = false;
  let lastMode;
  function handleNewButtonClick(_e) {
    if (lastMode == null) {
      lastMode = document.querySelector(".textButton.active").getAttribute(
        "mode",
      );
      console.log(lastMode);
    }

    melodyActive = true;
    frameManager.HideIframe(false);
    const btns = mode.querySelectorAll(".textButton");
    btns.forEach((btn) => {
      if (btn !== clonedButton) {
        btn.className = "textButton";
      }
    });

    const leaderboard = document.querySelector(".view-leaderboards");
    let pause = false;
    leaderboard.addEventListener(
      "click",
      (_e) => {
        if (pause) return;
        mode.querySelector(".textButton").click();
        pause = true;
        setTimeout(() => {
          leaderboard.click();
          setTimeout(() => {
            pause = false;
          }, 50);
        }, 50);
      },
    );

    const tohide = [
      ".puncAndNum",
      ".customText",
      ".quoteLength",
      ".time",
      ".wordCount",
    ];
    tohide.forEach((className) => {
      const element = row.querySelector(className);
      element.classList.add("hidden");
    });

    const left = row.querySelector(".leftSpacer");
    left.classList.add("scrolled");
    const right = row.querySelector(".rightSpacer");
    right.classList.add("scrolled");

    clonedButton.className = "textButton MyButton active";

    frameManager.postToFrame({
      type: "ICONS_UPDATE",
    });
  }

  clonedButton.addEventListener(
    "click",
    (e) => handleNewButtonClick(e),
  );

  function handleOtherButtonClick(e) {
    //prevent site from idling when switching back to the same mode
    if (lastMode == e.target.getAttribute("mode") && melodyActive) {
      const otherButtons = mode.querySelectorAll(`.textButton`);
      const otherButton = otherButtons[0].getAttribute("mode") == lastMode
        ? otherButtons[1]
        : otherButtons[0];
      otherButton.click();
      setTimeout(() => {
        e.target.click();
      }, 5);
    }

    lastMode = e.target.getAttribute("mode");
    frameManager.HideIframe(true);
    clonedButton.className = "textButton MyButton";
    melodyActive = false;
  }

  const buttons = Array.from(row.querySelectorAll("button"));
  buttons.push(document.querySelector(".textButton.view-settings"));
  buttons.push(document.querySelector(".textButton.view-about"));
  buttons.push(document.querySelector(".textButton.view-login"));

  buttons.forEach((button) => {
    if (button !== clonedButton) {
      button.addEventListener(
        "click",
        (e) => handleOtherButtonClick(e),
      );
    }
  });
}
