window.qweather_key = window.qweather_key || '';
window.qweather_api_host = window.qweather_api_host || '';
window.ip_api_key = window.ip_api_key || '';
window.clock_rectangle = window.clock_rectangle || '115.79,28.68';
window.clock_default_rectangle_enable = window.clock_default_rectangle_enable || 'true';

(function () {
  // ponytail: 本地也注入（卡片只显示加载动图，因 qweather 密钥白名单不含 localhost 会 403）。要恢复只在线上注入就加回 IS_LOCAL 判断
  function getClockHost() {
    // 优先插到个人资料卡正下方；文章页走 sticky_layout 分支时退回原位置
    return document.querySelector('.card-widget.card-info') || document.querySelector('.sticky_layout');
  }

  function injectClockCard() {
    var host = getClockHost();
    if (!host || document.getElementById('hexo_electric_clock')) return;
    var div = document.createElement('div');
    div.className = 'card-widget card-clock';
    div.innerHTML =
      '<div class="card-glass"><div class="card-background"><div class="card-content">' +
      '<div id="hexo_electric_clock">' +
      '<div class="entered loading" id="card-clock-loading"></div>' +
      '</div></div></div></div>';
    if (host.classList.contains('sticky_layout')) {
      host.insertBefore(div, host.firstChild);
    } else {
      host.insertAdjacentElement('afterend', div);
    }
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
    if (getClockHost()) {
      injectClockCard();
      return;
    }
    setTimeout(tryInject, 200);
  }

  function refreshClock() {
    var clockEl = document.getElementById('hexo_electric_clock');
    if (getClockHost() && !clockEl) {
      injectClockCard();
    } else if (window.getIpInfo) {
      window.getIpInfo();
    }
  }

  tryInject();
  document.addEventListener('pjax:complete', refreshClock);
})();