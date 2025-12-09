(function () {
  'use strict';

  // Extract ALL player IDs from script src URLs
  function getAllPlayerIdsFromScripts() {
    const scripts = document.getElementsByTagName('script');
    const playerIds = [];

    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src && src.includes('embed-resize.js')) {
        const url = new URL(src);
        const playerId = url.searchParams.get('id');
        if (playerId && !playerIds.includes(playerId)) {
          playerIds.push(playerId);
        }
      }
    }
    return playerIds;
  }

  const targetPlayerIds = getAllPlayerIdsFromScripts();

  if (targetPlayerIds.length === 0) {
    console.warn('MixFlip: No player IDs found in embed-resize.js script src');
    return;
  }

  let messageListenerReady = false;

  // Function to find and resize the iframe
  function resizePlayerIframe(playerId, height) {
    const iframeId = `mixflip-player-iframe-${playerId}`;
    const iframe = document.getElementById(iframeId);

    if (iframe) {
      iframe.style.height = `${height}px`;
      iframe.dispatchEvent(
        new CustomEvent('mixflip-resize', {
          detail: { playerId, height }
        })
      );
    }
  }

  // Listen for resize messages from ANY iframe
  function handleMessage(event) {
    if (!event.data || event.data.type !== 'mixflip-player-resize') {
      return;
    }

    const { playerId, height } = event.data;

    // Check if this message is for any of our target players
    if (targetPlayerIds.includes(playerId)) {
      resizePlayerIframe(playerId, height);
    }
  }

  // Set up message listener immediately
  function setupMessageListener() {
    if (messageListenerReady) return;

    if (window.addEventListener) {
      window.addEventListener('message', handleMessage, false);
    } else {
      window.attachEvent('onmessage', handleMessage);
    }

    messageListenerReady = true;

    // Signal to ALL iframes that parent is ready
    targetPlayerIds.forEach((playerId) => {
      const iframeId = `mixflip-player-iframe-${playerId}`;
      const iframe = document.getElementById(iframeId);

      if (iframe && iframe.contentWindow) {
        // Small delay to ensure iframe is fully loaded
        setTimeout(() => {
          iframe.contentWindow.postMessage(
            {
              type: 'mixflip-parent-ready',
              playerId: playerId
            },
            '*'
          );
        }, 100);
      }
    });
  }

  // Initialize immediately, don't wait for DOM
  setupMessageListener();

  // Also set up when DOM is ready as fallback
  function initialize() {
    setupMessageListener();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
