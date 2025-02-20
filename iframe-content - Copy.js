// Embedded page content script
window.addEventListener('message', (event) => {
    console.log('gg');
  if (event.data.type === 'STYLE_UPDATE') {
    const embedElements = document.querySelectorAll('.informational');
    console.log('ggg');
    embedElements.forEach(element => {
      Object.assign(element.style, event.data.styles);
    });
  }
});

