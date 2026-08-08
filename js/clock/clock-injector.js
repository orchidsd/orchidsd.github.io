window.qweather_key = window.qweather_key || '2bd51aa2dc434a64ad75d58d3d65bae7';
window.qweather_api_host = window.qweather_api_host || 'qq3qqtvrmx.re.qweatherapi.com';
window.ip_api_key = window.ip_api_key || 'fA2rqSZdyXnEAuruGzD3tdtMib';
window.clock_rectangle = window.clock_rectangle || '115.79,28.68';
window.clock_default_rectangle_enable = window.clock_default_rectangle_enable || 'true';

(function () {
  function injectClockCard() {
    var layout = document.querySelector('.sticky_layout');
    if (!layout || document.getElementById('hexo_electric_clock')) return;
    var div = document.createElement('div');
    div.className = 'card-widget card-clock';
    div.innerHTML =
      '<div class="card-glass"><div class="card-background"><div class="card-content">' +
      '<div id="hexo_electric_clock">' +
      '<img class="entered loading" id="card-clock-loading" src="https://cdn.cbd.int/hexo-butterfly-clock-anzhiyu/lib/loading.gif" style="height: 120px; width: 100%;"/>' +
      '</div></div></div></div>';
    layout.insertBefore(div, layout.firstChild);
    if (window.getIpInfo) {
      window.getIpInfo();
    } else {
      loadClockJs();
    }
  }

  function loadClockJs() {
    if (document.getElementById('clock-min-js')) return;
    if (window.__clockLoaded) return;
    window.__clockLoaded = true;
    var s = document.createElement('script');
    s.id = 'clock-min-js';
    s.src = '/js/clock/clock.min.js';
    s.onload = function () {
      if (window.getIpInfo) window.getIpInfo();
    };
    document.head.appendChild(s);
  }

  function tryInject() {
    if (document.querySelector('.sticky_layout')) {
      injectClockCard();
      return;
    }
    setTimeout(tryInject, 200);
  }

  function refreshClock() {
    var clockEl = document.getElementById('hexo_electric_clock');
    var layout = document.querySelector('.sticky_layout');
    if (clockEl || layout) {
      if (layout && !clockEl) {
        injectClockCard();
      } else if (window.getIpInfo) {
        window.getIpInfo();
      }
    }
  }

  tryInject();
  document.addEventListener('pjax:complete', refreshClock);
})();