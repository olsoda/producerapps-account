(function () {
  'use strict';

  // Create a standalone instance for stats.mixflip.io
  var r = window.location,
    i = window.document;
  var instanceName = 'plausibleMixFlip'; // Unique name for this instance
  var apiUrl = 'https://stats.mixflip.io/api/event';
  var domain = 'mixflip.me';

  function s(e, t) {
    e && console.warn('Ignoring Event: ' + e);
    t && t.callback && t.callback();
  }

  function sendEvent(eventName, options) {
    if (
      /^localhost$|^127(\.[0-9]+){0,2}\.[0-9]+$|^\[::1?\]$/.test(r.hostname) ||
      'file:' === r.protocol
    )
      return s('localhost', options);

    if (
      (window._phantom ||
        window.__nightmare ||
        window.navigator.webdriver ||
        window.Cypress) &&
      !window.__plausible
    )
      return s(null, options);

    try {
      if ('true' === window.localStorage[`${instanceName}_ignore`])
        return s('localStorage flag', options);
    } catch (e) {}

    var n = {
      n: eventName,
      u: r.href,
      d: domain,
      r: i.referrer || null
    };

    // Only include meta and props if this is not a pageview event
    if (eventName !== 'pageview') {
      if (options && options.meta) n.m = JSON.stringify(options.meta);
      if (options && options.props) n.p = options.props;
    }

    var a = new XMLHttpRequest();
    a.open('POST', apiUrl, true);
    a.setRequestHeader('Content-Type', 'text/plain');
    a.send(JSON.stringify(n));

    a.onreadystatechange = function () {
      if (4 === a.readyState && options && options.callback) {
        options.callback({ status: a.status });
      }
    };
  }

  function init() {
    var prevPath = null;

    function trackPageview() {
      if (prevPath !== r.pathname) {
        prevPath = r.pathname;
        sendEvent('pageview');
      }
    }

    window[instanceName] = sendEvent;

    if ('prerender' === i.visibilityState) {
      i.addEventListener('visibilitychange', function () {
        if (!prevPath && 'visible' === i.visibilityState) trackPageview();
      });
    } else {
      trackPageview();
    }
  }

  init();
})();
