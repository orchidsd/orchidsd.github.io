// ===== 全局歌词解析工具（左下列播放器与首页播放器共用，避免三处重复实现）=====
window.__parseLrc = function (text) {
  const lines = [];
  const times = [];
  if (!text) return { lines, times };
  const regex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;
  text.split(/\r?\n/).forEach(rawLine => {
    const timeMatches = [];
    let match;
    while ((match = regex.exec(rawLine)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3] ? parseFloat("0." + match[3]) : 0;
      timeMatches.push(minutes * 60 + seconds + fraction);
    }
    if (!timeMatches.length) return;
    const lineText = rawLine.replace(regex, "").trim();
    timeMatches.forEach(t => {
      lines.push({ time: t, text: lineText });
      times.push(t);
    });
  });
  lines.sort((a, b) => a.time - b.time);
  times.sort((a, b) => a - b);
  return { lines, times };
};

const anzhiyu = {
  debounce: (func, wait = 0, immediate = false) => {
    let timeout;
    return (...args) => {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  throttle: function (func, wait, options = {}) {
    let timeout, context, args;
    let previous = 0;

    const later = () => {
      previous = options.leading === false ? 0 : new Date().getTime();
      timeout = null;
      func.apply(context, args);
      if (!timeout) context = args = null;
    };

    const throttled = (...params) => {
      const now = new Date().getTime();
      if (!previous && options.leading === false) previous = now;
      const remaining = wait - (now - previous);
      context = this;
      args = params;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
    };

    return throttled;
  },

  sidebarPaddingR: () => {
    const innerWidth = window.innerWidth;
    const clientWidth = document.body.clientWidth;
    const paddingRight = innerWidth - clientWidth;
    if (innerWidth !== clientWidth) {
      document.body.style.paddingRight = paddingRight + "px";
    }
  },

  snackbarShow: (text, showActionFunction = false, duration = 2000, actionText = false) => {
    const { position, bgLight, bgDark } = GLOBAL_CONFIG.Snackbar;
    const bg = document.documentElement.getAttribute("data-theme") === "light" ? bgLight : bgDark;
    const root = document.querySelector(":root");
    root.style.setProperty("--anzhiyu-snackbar-time", duration + "ms");

    Snackbar.show({
      text: text,
      backgroundColor: bg,
      onActionClick: showActionFunction,
      actionText: actionText,
      showAction: actionText,
      duration: duration,
      pos: position,
      customClass: "snackbar-css",
    });
  },

  loadComment: (dom, callback) => {
    if ("IntersectionObserver" in window) {
      const observerItem = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            callback();
            observerItem.disconnect();
          }
        },
        { threshold: [0] }
      );
      observerItem.observe(dom);
    } else {
      callback();
    }
  },

  scrollToDest: (pos, time = 500) => {
    const currentPos = window.pageYOffset;
    if ("scrollBehavior" in document.documentElement.style) {
      window.scrollTo({
        top: pos,
        behavior: "smooth",
      });
      return;
    }

    let start = null;
    pos = +pos;
    window.requestAnimationFrame(function step(currentTime) {
      start = !start ? currentTime : start;
      const progress = currentTime - start;
      if (currentPos < pos) {
        window.scrollTo(0, ((pos - currentPos) * progress) / time + currentPos);
      } else {
        window.scrollTo(0, currentPos - ((currentPos - pos) * progress) / time);
      }
      if (progress < time) {
        window.requestAnimationFrame(step);
      } else {
        window.scrollTo(0, pos);
      }
    });
  },

  initJustifiedGallery: function (selector) {
    const runJustifiedGallery = i => {
      if (!anzhiyu.isHidden(i)) {
        fjGallery(i, {
          itemSelector: ".fj-gallery-item",
          rowHeight: i.getAttribute("data-rowHeight"),
          gutter: 4,
          onJustify: function () {
            this.$container.style.opacity = "1";
          },
        });
      }
    };

    if (Array.from(selector).length === 0) runJustifiedGallery(selector);
    else
      selector.forEach(i => {
        runJustifiedGallery(i);
      });
  },

  animateIn: (ele, text) => {
    ele.style.display = "block";
    ele.style.animation = text;
  },

  animateOut: (ele, text) => {
    ele.addEventListener("animationend", function f() {
      ele.style.display = "";
      ele.style.animation = "";
      ele.removeEventListener("animationend", f);
    });
    ele.style.animation = text;
  },

  /**
   * @param {*} selector
   * @param {*} eleType the type of create element
   * @param {*} options object key: value
   */
  wrap: (selector, eleType, options) => {
    const creatEle = document.createElement(eleType);
    for (const [key, value] of Object.entries(options)) {
      creatEle.setAttribute(key, value);
    }
    selector.parentNode.insertBefore(creatEle, selector);
    creatEle.appendChild(selector);
  },

  isHidden: ele => ele.offsetHeight === 0 && ele.offsetWidth === 0,

  getEleTop: ele => {
    let actualTop = ele.offsetTop;
    let current = ele.offsetParent;

    while (current !== null) {
      actualTop += current.offsetTop;
      current = current.offsetParent;
    }

    return actualTop;
  },

  loadLightbox: ele => {
    const service = GLOBAL_CONFIG.lightbox;

    if (service === "mediumZoom") {
      const zoom = mediumZoom(ele);
      zoom.on("open", e => {
        const photoBg = document.documentElement.getAttribute("data-theme") === "dark" ? "#121212" : "#fff";
        zoom.update({
          background: photoBg,
        });
      });
    }

    if (service === "fancybox") {
      Array.from(ele).forEach(i => {
        if (i.parentNode.tagName !== "A") {
          const dataSrc = i.dataset.lazySrc || i.src;
          const dataCaption = i.title || i.alt || "";
          anzhiyu.wrap(i, "a", {
            href: dataSrc,
            "data-fancybox": "gallery",
            "data-caption": dataCaption,
            "data-thumb": dataSrc,
          });
        }
      });

      if (!window.fancyboxRun) {
        Fancybox.bind("[data-fancybox]", {
          Hash: false,
          Thumbs: {
            autoStart: false,
          },
        });
        window.fancyboxRun = true;
      }
    }
  },

  setLoading: {
    add: ele => {
      const html = `
        <div class="loading-container">
          <div class="loading-item">
            <div></div><div></div><div></div><div></div><div></div>
          </div>
        </div>
      `;
      ele.insertAdjacentHTML("afterend", html);
    },
    remove: ele => {
      ele.nextElementSibling.remove();
    },
  },

  updateAnchor: anchor => {
    if (anchor !== window.location.hash) {
      if (!anchor) anchor = location.pathname;
      const title = GLOBAL_CONFIG_SITE.title;
      window.history.replaceState(
        {
          url: location.href,
          title,
        },
        title,
        anchor
      );
    }
  },

  getScrollPercent: (currentTop, ele) => {
    const docHeight = ele.clientHeight;
    const winHeight = document.documentElement.clientHeight;
    const headerHeight = ele.offsetTop;
    const contentMath =
      docHeight > winHeight ? docHeight - winHeight : document.documentElement.scrollHeight - winHeight;
    const scrollPercent = (currentTop - headerHeight) / contentMath;
    const scrollPercentRounded = Math.round(scrollPercent * 100);
    const percentage = scrollPercentRounded > 100 ? 100 : scrollPercentRounded <= 0 ? 0 : scrollPercentRounded;
    return percentage;
  },

  addGlobalFn: (key, fn, name = false, parent = window) => {
    const globalFn = parent.globalFn || {};
    const keyObj = globalFn[key] || {};

    if (name && keyObj[name]) return;

    name = name || Object.keys(keyObj).length;
    keyObj[name] = fn;
    globalFn[key] = keyObj;
    parent.globalFn = globalFn;
  },

  addEventListenerPjax: (ele, event, fn, option = false) => {
    ele.addEventListener(event, fn, option);
    anzhiyu.addGlobalFn("pjax", () => {
      ele.removeEventListener(event, fn, option);
    });
  },

  removeGlobalFnEvent: (key, parent = window) => {
    const { globalFn = {} } = parent;
    const keyObj = globalFn[key] || {};
    const keyArr = Object.keys(keyObj);
    if (!keyArr.length) return;
    keyArr.forEach(i => {
      keyObj[i]();
    });
    delete parent.globalFn[key];
  },

  //更改主题色
  changeThemeMetaColor: function (color) {
    // console.info(`%c ${color}`, `font-size:36px;color:${color};`);
    if (themeColorMeta !== null) {
      themeColorMeta.setAttribute("content", color);
    }
  },

  //顶栏自适应主题色
  initThemeColor: function () {
    let themeColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--anzhiyu-bar-background")
      .trim()
      .replace('"', "")
      .replace('"', "");
    const currentTop = window.scrollY || document.documentElement.scrollTop;
    if (currentTop > 26) {
      if (anzhiyu.is_Post()) {
        themeColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--anzhiyu-meta-theme-post-color")
          .trim()
          .replace('"', "")
          .replace('"', "");
      }
      if (themeColorMeta.getAttribute("content") === themeColor) return;
      this.changeThemeMetaColor(themeColor);
    } else {
      if (themeColorMeta.getAttribute("content") === themeColor) return;
      this.changeThemeMetaColor(themeColor);
    }
  },
  //是否是文章页
  is_Post: function () {
    var url = window.location.href; //获取url
    if (url.indexOf("/posts/") >= 0) {
      //判断url地址中是否包含code字符串
      return true;
    } else {
      return false;
    }
  },
  //监测是否在页面开头
  addNavBackgroundInit: function () {
    var scrollTop = 0,
      bodyScrollTop = 0,
      documentScrollTop = 0;
    if ($bodyWrap) {
      bodyScrollTop = $bodyWrap.scrollTop;
    }
    if (document.documentElement) {
      documentScrollTop = document.documentElement.scrollTop;
    }
    scrollTop = bodyScrollTop - documentScrollTop > 0 ? bodyScrollTop : documentScrollTop;

    if (scrollTop != 0) {
      pageHeaderEl.classList.add("nav-fixed");
      pageHeaderEl.classList.add("nav-visible");
    }
  },
  // 下载图片
  downloadImage: function (imgsrc, name) {
    //下载图片地址和图片名
    rm.hideRightMenu();
    if (rm.downloadimging == false) {
      rm.downloadimging = true;
      anzhiyu.snackbarShow("正在下载中，请稍后", false, 10000);
      setTimeout(function () {
        let image = new Image();
        // 解决跨域 Canvas 污染问题
        image.setAttribute("crossOrigin", "anonymous");
        image.onload = function () {
          let canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          let context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, image.width, image.height);
          let url = canvas.toDataURL("image/png"); //得到图片的base64编码数据
          let a = document.createElement("a"); // 生成一个a元素
          let event = new MouseEvent("click"); // 创建一个单击事件
          a.download = name || "photo"; // 设置图片名称
          a.href = url; // 将生成的URL设置为a.href属性
          a.dispatchEvent(event); // 触发a的单击事件
        };
        image.src = imgsrc;
        anzhiyu.snackbarShow("图片已添加盲水印，请遵守版权协议");
        rm.downloadimging = false;
      }, "10000");
    } else {
      anzhiyu.snackbarShow("有正在进行中的下载，请稍后再试");
    }
  },
  //禁止图片右键单击
  stopImgRightDrag: function () {
    var img = document.getElementsByTagName("img");
    for (var i = 0; i < img.length; i++) {
      img[i].addEventListener("dragstart", function () {
        return false;
      });
    }
  },
  //滚动到指定id
  scrollTo: function (id) {
    var domTop = document.querySelector(id).offsetTop;
    window.scrollTo(0, domTop - 80);
  },
  //隐藏侧边栏
  hideAsideBtn: () => {
    // Hide aside
    const $htmlDom = document.documentElement.classList;
    $htmlDom.contains("hide-aside")
      ? saveToLocal.set("aside-status", "show", 2)
      : saveToLocal.set("aside-status", "hide", 2);
    $htmlDom.toggle("hide-aside");
    $htmlDom.contains("hide-aside")
      ? document.querySelector("#consoleHideAside").classList.add("on")
      : document.querySelector("#consoleHideAside").classList.remove("on");
  },
  // 热评切换
  switchCommentBarrage: function () {
    let commentBarrage = document.querySelector(".comment-barrage");
    if (commentBarrage) {
      if (window.getComputedStyle(commentBarrage).display === "flex") {
        commentBarrage.style.display = "none";
        anzhiyu.snackbarShow("✨ 已关闭评论弹幕");
        document.querySelector(".menu-commentBarrage-text").textContent = "显示热评";
        document.querySelector("#consoleCommentBarrage").classList.remove("on");
        localStorage.setItem("commentBarrageSwitch", "false");
      } else {
        commentBarrage.style.display = "flex";
        document.querySelector(".menu-commentBarrage-text").textContent = "关闭热评";
        document.querySelector("#consoleCommentBarrage").classList.add("on");
        anzhiyu.snackbarShow("✨ 已开启评论弹幕");
        localStorage.removeItem("commentBarrageSwitch");
      }
    }
    rm && rm.hideRightMenu();
  },
  initPaginationObserver: () => {
    const commentElement = document.getElementById("post-comment");
    const paginationElement = document.getElementById("pagination");

    if (commentElement && paginationElement) {
      new IntersectionObserver(entries => {
        const commentBarrage = document.querySelector(".comment-barrage");

        entries.forEach(entry => {
          if (entry.isIntersecting) {
            paginationElement.classList.add("show-window");
            if (commentBarrage) {
              commentBarrage.style.bottom = "-200px";
            }
          } else {
            paginationElement.classList.remove("show-window");
            if (commentBarrage) {
              commentBarrage.style.bottom = "0px";
            }
          }
        });
      }).observe(commentElement);
    }
  },
  // 初始化即刻
  initIndexEssay: function () {
    if (!document.getElementById("bbTimeList")) return;
    setTimeout(() => {
      let essay_bar_swiper = new Swiper(".essay_bar_swiper_container", {
        passiveListeners: true,
        direction: "vertical",
        loop: true,
        autoplay: {
          disableOnInteraction: true,
          delay: 3000,
        },
        mousewheel: true,
      });

      let essay_bar_comtainer = document.getElementById("bbtalk");
      if (essay_bar_comtainer !== null) {
        essay_bar_comtainer.onmouseenter = function () {
          essay_bar_swiper.autoplay.stop();
        };
        essay_bar_comtainer.onmouseleave = function () {
          essay_bar_swiper.autoplay.start();
        };
      }
    }, 100);
  },
  scrollByMouseWheel: function ($list, $target) {
    const scrollHandler = function (e) {
      $list.scrollLeft -= e.wheelDelta / 2;
      e.preventDefault();
    };
    $list.addEventListener("mousewheel", scrollHandler, { passive: false });
    if ($target) {
      $target.classList.add("selected");
      $list.scrollLeft = $target.offsetLeft - $list.offsetLeft - ($list.offsetWidth - $target.offsetWidth) / 2;
    }
  },
  // catalog激活
  catalogActive: function () {
    const $list = document.getElementById("catalog-list");
    if ($list) {
      const pathname = decodeURIComponent(window.location.pathname);
      const catalogListItems = $list.querySelectorAll(".catalog-list-item");

      let $catalog = null;
      catalogListItems.forEach(item => {
        if (pathname.startsWith(item.id)) {
          $catalog = item;
          return;
        }
      });

      anzhiyu.scrollByMouseWheel($list, $catalog);
    }
  },
  // Page Tag 激活
  tagsPageActive: function () {
    const $list = document.getElementById("tag-page-tags");
    if ($list) {
      const $tagPageTags = document.getElementById(decodeURIComponent(window.location.pathname));
      anzhiyu.scrollByMouseWheel($list, $tagPageTags);
    }
  },
  // 修改时间显示"最近"
  diffDate: function (d, more = false, simple = false) {
    const dateNow = new Date();
    const datePost = new Date(d);
    const dateDiff = dateNow.getTime() - datePost.getTime();
    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;

    let result;
    if (more) {
      const monthCount = dateDiff / month;
      const dayCount = dateDiff / day;
      const hourCount = dateDiff / hour;
      const minuteCount = dateDiff / minute;

      if (monthCount >= 1) {
        result = datePost.toLocaleDateString().replace(/\//g, "-");
      } else if (dayCount >= 1) {
        result = parseInt(dayCount) + " " + GLOBAL_CONFIG.date_suffix.day;
      } else if (hourCount >= 1) {
        result = parseInt(hourCount) + " " + GLOBAL_CONFIG.date_suffix.hour;
      } else if (minuteCount >= 1) {
        result = parseInt(minuteCount) + " " + GLOBAL_CONFIG.date_suffix.min;
      } else {
        result = GLOBAL_CONFIG.date_suffix.just;
      }
    } else if (simple) {
      const monthCount = dateDiff / month;
      const dayCount = dateDiff / day;
      const hourCount = dateDiff / hour;
      const minuteCount = dateDiff / minute;
      if (monthCount >= 1) {
        result = datePost.toLocaleDateString().replace(/\//g, "-");
      } else if (dayCount >= 1 && dayCount <= 3) {
        result = parseInt(dayCount) + " " + GLOBAL_CONFIG.date_suffix.day;
      } else if (dayCount > 3) {
        result = datePost.getMonth() + 1 + "/" + datePost.getDate();
      } else if (hourCount >= 1) {
        result = parseInt(hourCount) + " " + GLOBAL_CONFIG.date_suffix.hour;
      } else if (minuteCount >= 1) {
        result = parseInt(minuteCount) + " " + GLOBAL_CONFIG.date_suffix.min;
      } else {
        result = GLOBAL_CONFIG.date_suffix.just;
      }
    } else {
      result = parseInt(dateDiff / day);
    }
    return result;
  },

  // 修改即刻中的时间显示
  changeTimeInEssay: function () {
    document.querySelector("#bber") &&
      document.querySelectorAll("#bber time").forEach(function (e) {
        var t = e,
          datetime = t.getAttribute("datetime");
        (t.innerText = anzhiyu.diffDate(datetime, true)), (t.style.display = "inline");
      });
  },
  // 修改相册集中的时间
  changeTimeInAlbumDetail: function () {
    document.querySelector("#album_detail") &&
      document.querySelectorAll("#album_detail time").forEach(function (e) {
        var t = e,
          datetime = t.getAttribute("datetime");
        (t.innerText = anzhiyu.diffDate(datetime, true)), (t.style.display = "inline");
      });
  },
  // 刷新瀑布流
  reflashEssayWaterFall: function () {
    const waterfallEl = document.getElementById("waterfall");
    if (waterfallEl) {
      setTimeout(function () {
        waterfall(waterfallEl);
        waterfallEl.classList.add("show");
      }, 800);
    }
  },
  sayhi: function () {
    const $sayhiEl = document.getElementById("author-info__sayhi");

    const getTimeState = () => {
      const hour = new Date().getHours();
      let message = "";

      if (hour >= 0 && hour <= 5) {
        message = "睡个好觉，保证精力充沛";
      } else if (hour > 5 && hour <= 10) {
        message = "一日之计在于晨";
      } else if (hour > 10 && hour <= 14) {
        message = "吃饱了才有力气干活";
      } else if (hour > 14 && hour <= 18) {
        message = "集中精力，攻克难关";
      } else if (hour > 18 && hour <= 24) {
        message = "不要太劳累了，早睡更健康";
      }

      return message;
    };

    if ($sayhiEl) {
      $sayhiEl.innerHTML = getTimeState();
    }
  },

  // 友链注入预设评论
  addFriendLink() {
    var input = document.getElementsByClassName("el-textarea__inner")[0];
    if (!input) return;
    const evt = new Event("input", { cancelable: true, bubbles: true });
    const defaultPlaceholder =
      "昵称（请勿包含博客等字样）：\n网站地址（要求博客地址，请勿提交个人主页）：\n头像图片url（请提供尽可能清晰的图片，我会上传到我自己的图床）：\n描述：\n站点截图（可选）：\n";
    input.value = this.getConfigIfPresent(GLOBAL_CONFIG.linkPageTop, "addFriendPlaceholder", defaultPlaceholder);
    input.dispatchEvent(evt);
    input.focus();
    input.setSelectionRange(-1, -1);
  },
  // 获取配置，如果为空则返回默认值
  getConfigIfPresent: function (config, configKey, defaultValue) {
    if (!config) return defaultValue;
    if (!config.hasOwnProperty(configKey)) return defaultValue;
    if (!config[configKey]) return defaultValue;
    return config[configKey];
  },
  //切换音乐播放状态
  musicToggle: function (changePaly = true) {
    if (!anzhiyu_musicFirst) {
      anzhiyu.musicBindEvent();
      anzhiyu_musicFirst = true;
    }
    let msgPlay = '<i class="anzhiyufont anzhiyu-icon-play"></i><span>播放音乐</span>';
    let msgPause = '<i class="anzhiyufont anzhiyu-icon-pause"></i><span>暂停音乐</span>';
    if (anzhiyu_musicPlaying) {
      navMusicEl.classList.remove("playing");
      document.getElementById("menu-music-toggle").innerHTML = msgPlay;
      document.getElementById("nav-music-hoverTips").innerHTML = "音乐已暂停";
      document.querySelector("#consoleMusic").classList.remove("on");
      anzhiyu_musicPlaying = false;
      navMusicEl.classList.remove("stretch");
    } else {
      navMusicEl.classList.add("playing");
      document.getElementById("menu-music-toggle").innerHTML = msgPause;
      document.querySelector("#consoleMusic").classList.add("on");
      anzhiyu_musicPlaying = true;
      navMusicEl.classList.add("stretch");
    }
    if (changePaly) anzhiyu.getNavMusicPlayer().toggle();
    rm && rm.hideRightMenu();
  },
  // 音乐伸缩
  musicTelescopic: function () {
    if (navMusicEl.classList.contains("stretch")) {
      navMusicEl.classList.remove("stretch");
    } else {
      navMusicEl.classList.add("stretch");
    }
  },

  //音乐上一曲
  musicSkipBack: function () {
    anzhiyu.getNavMusicPlayer().skipBack();
    rm && rm.hideRightMenu();
  },

  //音乐下一曲
  musicSkipForward: function () {
    anzhiyu.getNavMusicPlayer().skipForward();
    rm && rm.hideRightMenu();
  },

  // 获取左下角自定义音乐播放器实例
  getNavMusicPlayer: function () {
    const navMusicAplayer = document.getElementById("nav-music-aplayer");
    if (navMusicAplayer && navMusicAplayer._aplayer) return navMusicAplayer._aplayer;
    return {
      toggle: function () {},
      skipBack: function () {},
      skipForward: function () {},
      audio: null,
      on: function () {},
    };
  },

  // 初始化左下角音乐播放器（加载 yoasobi-music 歌单）
  initNavMusicPlayer: async function () {
    const navMusicAplayer = document.getElementById("nav-music-aplayer");
    if (!navMusicAplayer) return;
    // ===== audio 常驻 body 隐藏容器：pjax 只重建 UI 壳，audio 永不脱离/暂停（与首页右上角播放器同架构）=====
    let persistentHolder = document.getElementById("nav-music-persistent-container");
    if (!persistentHolder) {
      persistentHolder = document.createElement("div");
      persistentHolder.id = "nav-music-persistent-container";
      persistentHolder.style.display = "none";
      document.body.appendChild(persistentHolder);
    }
    let persistentAudio = persistentHolder.querySelector("audio");
    if (!persistentAudio) {
      persistentAudio = document.createElement("audio");
      persistentAudio.id = "nav-music-audio-element";
      persistentAudio.preload = "none";
      persistentHolder.appendChild(persistentAudio);
    }
    // ===== 空闲自动收起：播放中 10s 无操作自动收回为小卡 =====
    if (!window._navMusicIdleBound) {
      window._navMusicIdleBound = true;
      const scheduleIdle = () => {
        if (window._navMusicIdleTimer) clearTimeout(window._navMusicIdleTimer);
        window._navMusicIdleTimer = setTimeout(() => {
          const el = document.getElementById("nav-music");
          if (el && el.classList.contains("playing") && el.classList.contains("stretch")) {
            el.classList.remove("stretch");
          }
        }, 10000);
      };
      document.addEventListener("mousemove", scheduleIdle);
      document.addEventListener("click", scheduleIdle);
      document.addEventListener("keydown", scheduleIdle);
      scheduleIdle();
    }
    // pjax 不替换 body-wrap 外的 nav-music-aplayer（容器在 body-wrap 之外），
    // 定制版 APlayer 模板无 .aplayer 顶层类（为 aplayer-body），这里用 _aplayer 实例判断：
    // 已有实例则无需重建 → 切页零中断（audio 常驻持续播放）
    const needInit = !navMusicAplayer._aplayer && !navMusicAplayer.querySelector(".aplayer, .aplayer-body");
    if (!needInit) return;
    // ===== 全局状态捕获：pjax:send 时 destroy 会被 patch 为不清 audio，状态天然保留；pagehide 落盘 sessionStorage（整页刷新恢复）=====
    if (!window._navMusicStateBound) {
      window._navMusicStateBound = true;
      document.addEventListener("pjax:send", () => {
        const p = persistentAudio;
        if (p && p.currentSrc) {
          window._navMusicLive = {
            url: p.currentSrc || "",
            time: p.currentTime || 0,
            playing: !p.paused,
            index: -1,
          };
        }
      });
      window.addEventListener("pagehide", () => {
        if (persistentAudio && persistentAudio.currentSrc) {
          try {
            sessionStorage.setItem(
              "navMusicState",
              JSON.stringify({
                url: persistentAudio.currentSrc,
                time: persistentAudio.currentTime || 0,
                playing: !persistentAudio.paused,
              })
            );
          } catch (e) {}
        }
      });
    }
    // 重建前记录原播放状态：常驻 audio 状态天然保留，直接读取（pjax 重建时 src/paused/currentTime 不受影响）
    let oldState = persistentAudio && persistentAudio.currentSrc
      ? {
          playing: !persistentAudio.paused,
          index: -1,
          time: persistentAudio.currentTime || 0,
          url: persistentAudio.currentSrc || "",
        }
      : null;
    let savedState = null;
    try {
      const raw = sessionStorage.getItem("navMusicState");
      if (raw) {
        savedState = JSON.parse(raw);
        sessionStorage.removeItem("navMusicState");
      }
    } catch (e) {}
    if (!oldState && savedState && savedState.url) {
      persistentAudio.src = savedState.url;
      persistentAudio.load();
      // 视为有旧状态：orderedAudioList 会把该歌排到首位，setAudio patch 同 URL 跳过 src 赋值，避免被构造时 switch(0) 覆盖；
      // 进度在 loadedmetadata 后由下方恢复逻辑设置（src 赋值会重置 currentTime）
      oldState = { playing: savedState.playing, index: -1, time: savedState.time || 0, url: savedState.url };
    }
    navMusicAplayer._aplayer = null;
    // APlayer 脚本（CDN）可能晚于本函数加载，最多等待 3 秒
    let waitCount = 0;
    while (typeof APlayer === "undefined" && waitCount < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }
    if (typeof APlayer === "undefined") return;
    try {
      const response = await fetch("/json/music-yoasobi.json");
      if (!response.ok) return;
      const songs = await response.json();
      const audioList = songs.map(item => ({
        name: item.name,
        artist: item.artist,
        url: item.url,
        cover: item.cover || item.pic,
        lrc: item.lrc,
        theme: "var(--anzhiyu-main)",
      }));
      // 旧歌排到列表首位：新 APlayer 首曲即旧歌，复用 audio 后 src 相同不重载 → 播放零中断
      let orderedAudioList = audioList;
      if (oldState && oldState.url) {
        const normUrl = u => {
          try {
            return new URL(u, location.href).href;
          } catch (e) {
            return u;
          }
        };
        const oldIdx = audioList.findIndex(a => normUrl(a.url) === normUrl(oldState.url));
        if (oldIdx > 0) {
          orderedAudioList = [
            audioList[oldIdx],
            ...audioList.slice(0, oldIdx),
            ...audioList.slice(oldIdx + 1),
          ];
        }
      }
      // patch：让新 APlayer 复用常驻 audio（persistent 容器内）；同曲时跳过 src 赋值（避免重载与 loadedmetadata→seek(0) 复位进度）
      // 同时 patch destroy：只清 UI 壳，不清 audio（防 pjax:send 时 destroy 触发 pause() + audio.src="" 导致中断）
      const canReuse = !!oldState && typeof APlayer.prototype.initAudio === "function";
      const origInitAudio = typeof APlayer.prototype.initAudio === "function" ? APlayer.prototype.initAudio : null;
      const origSetAudio =
        typeof APlayer.prototype.setAudio === "function" ? APlayer.prototype.setAudio : null;
      if (origInitAudio) {
        const origDestroy = APlayer.prototype.destroy;
        if (origDestroy && !window._navMusicDestroyPatched) {
          window._navMusicDestroyPatched = true;
          APlayer.prototype.destroy = function () {
            if (this.container && this.container.id === "nav-music-aplayer") {
              // 仅移除 UI 壳；audio 常驻容器继续播放，src/paused 不动
              this.paused = true;
              this.timer && this.timer.destroy();
              try {
                this.container.innerHTML = "";
              } catch (e) {}
              this.events && this.events.trigger && this.events.trigger("destroy");
              return;
            }
            return origDestroy.call(this);
          };
        }
        APlayer.prototype.initAudio = function () {
          const holder = document.getElementById("nav-music-persistent-container");
          const existing = holder && holder.querySelector("audio");
          if (existing) {
            this.audio = existing;
            this.audio.preload = this.options.preload;
            if (this.events && this.events.audioEvents) {
              for (let i = 0; i < this.events.audioEvents.length; i++) {
                this.audio.addEventListener(this.events.audioEvents[i], e => {
                  this.events.trigger(this.events.audioEvents[i], e);
                });
              }
            }
            this.volume(this.storage.get("volume"), true);
          } else {
            origInitAudio.call(this);
          }
        };
        APlayer.prototype.setAudio = function (audio) {
          if (this.audio && audio && audio.url && this.audio.currentSrc) {
            const normUrl = u => {
              try {
                return new URL(u, location.href).href;
              } catch (e) {
                return u;
              }
            };
            if (normUrl(audio.url) === normUrl(this.audio.currentSrc)) return;
          }
          return origSetAudio.call(this, audio);
        };
      }
      const volume = parseFloat(navMusicAplayer.dataset.volume) || 0.7;
      let navPlayer;
      try {
        navPlayer = new APlayer({
          container: navMusicAplayer,
          audio: orderedAudioList,
          lrcType: 0,
          order: canReuse ? "list" : "random",
          mutex: true,
          preload: "none",
          volume: volume,
          theme: "var(--anzhiyu-main)",
        });
      } finally {
        if (origInitAudio) APlayer.prototype.initAudio = origInitAudio;
        if (origSetAudio) APlayer.prototype.setAudio = origSetAudio;
      }
      navMusicAplayer._aplayer = navPlayer;
      // 控制台打开时的音乐布局规则依赖 .aplayer-withlrc 选择器，主动补上（自绘歌词不走 lrcType，APlayer 不会自动加）
      navMusicAplayer.classList.add("aplayer-withlrc");
      // 恢复随机切歌顺序（仅首曲用 list 保证不重载）
      if (canReuse && navPlayer.list) navPlayer.list.order = "random";
      // 恢复播放状态：audio 常驻未中断，直接对齐 APlayer 实例状态（seek 走实例级覆写——直接设 audio.currentTime，
      // 绕开 APlayer.seek 的 duration=NaN 钳制归零 bug，并跳过 loadedmetadata 触发的 seek(0)）
      if (canReuse && oldState) {
        const origSeekFn = navPlayer.seek.bind(navPlayer);
        navPlayer.seek = function (time) {
          if (time === 0 && this.audio && !this.audio.paused) return;
          return origSeekFn(time);
        };
        if (oldState.time > 1) {
          if (navPlayer.audio.readyState >= 1) navPlayer.audio.currentTime = oldState.time;
          else navPlayer.audio.addEventListener("loadedmetadata", () => {
            try { navPlayer.audio.currentTime = oldState.time; } catch (e) {}
          }, { once: true });
        }
        if (oldState.playing && !navPlayer.audio.paused) {
          navPlayer.playing = true;
          navPlayer.paused = false;
          try { navPlayer.setUIPlaying && navPlayer.setUIPlaying(); } catch (e) {}
          try { navPlayer.bar && navPlayer.bar.set("played", navPlayer.audio.currentTime / (navPlayer.audio.duration || 1), "width"); } catch (e) {}
        } else if (oldState.playing) {
          navPlayer.play();
        }
      }
      // 无法复用（老版本 APlayer 无 initAudio 函数）回退：新 audio 后台预载，就绪后接力（常驻 audio 持续播放不中断）
      if (!canReuse && oldState && oldState.playing) {
        let targetIndex = oldState.index;
        const idxByUrl = audioList.findIndex(a => a.url === oldState.url);
        if (idxByUrl >= 0) targetIndex = idxByUrl;
        if (targetIndex < 0 || targetIndex >= audioList.length) targetIndex = 0;
        try {
          if (targetIndex !== 0) navPlayer.list.switch(targetIndex);
          let handed = false;
          const handOver = () => {
            if (handed) return;
            handed = true;
            try {
              if (oldState.time > 1) navPlayer.seek(oldState.time);
              navPlayer.play();
              if (persistentAudio && persistentAudio !== navPlayer.audio) {
                persistentAudio.pause();
                persistentAudio.removeAttribute("src");
                persistentAudio.load();
              }
            } catch (e) {}
          };
          if (navPlayer.audio.readyState >= 2) handOver();
          else navPlayer.audio.addEventListener("loadeddata", handOver, { once: true });
          setTimeout(handOver, 2500);
        } catch (e) {}
      }

      // ===== 自绘歌词（APlayer lrcType 3 异步 fetch 会与播放不同步，改为自行解析 + timeupdate 同步）=====
      const navMusicEl = document.getElementById("nav-music");
      const oldNavLrc = navMusicEl.querySelector(".nav-music-lrc");
      if (oldNavLrc) oldNavLrc.remove();
      const lrcEl = document.createElement("div");
      lrcEl.className = "nav-music-lrc";
      lrcEl.innerHTML = '<div class="nav-music-lrc-inner"></div>';
      navMusicEl.appendChild(lrcEl);
      const lrcInner = lrcEl.querySelector(".nav-music-lrc-inner");

      const parseNavLrc = text => {
        if (typeof window.__parseLrc === "function") return window.__parseLrc(text);
        const lines = [];
        const times = [];
        if (!text) return { lines, times };
        const regex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;
        text.split(/\r?\n/).forEach(rawLine => {
          const timeMatches = [];
          let match;
          while ((match = regex.exec(rawLine)) !== null) {
            const fraction = match[3] ? parseFloat("0." + match[3]) : 0;
            timeMatches.push(parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + fraction);
          }
          if (!timeMatches.length) return;
          const lineText = rawLine.replace(regex, "").trim();
          timeMatches.forEach(t => {
            lines.push({ time: t, text: lineText });
            times.push(t);
          });
        });
        lines.sort((a, b) => a.time - b.time);
        times.sort((a, b) => a - b);
        return { lines, times };
      };

      const renderNavLrc = parsed => {
        lrcInner.innerHTML = "";
        const rows = parsed.lines && parsed.lines.length ? parsed.lines : [];
        if (!rows.length) {
          const p = document.createElement("p");
          p.textContent = "暂无歌词";
          p.classList.add("nav-music-lrc-placeholder");
          lrcInner.appendChild(p);
          return;
        }
        rows.forEach(l => {
          const p = document.createElement("p");
          p.textContent = l.text || "♪";
          lrcInner.appendChild(p);
        });
      };

      const updateNavLrc = currentTime => {
        const times = lrcEl._times;
        if (!times || !times.length) return;
        let idx = -1;
        for (let i = times.length - 1; i >= 0; i--) {
          if (currentTime >= times[i]) {
            idx = i;
            break;
          }
        }
        if (idx === lrcEl._idx) return;
        lrcEl._idx = idx;
        const ps = lrcInner.querySelectorAll("p");
        ps.forEach((p, i) => {
          p.classList.toggle("nav-music-lrc-current", i === idx);
        });
        lrcInner.style.transform = idx >= 0 ? `translateY(${56 - idx * 28}px)` : "";
      };

      const loadNavLrc = () => {
        const track = navPlayer.list.audios[navPlayer.list.index];
        const url = track && (track.lrc || track.lyric);
        if (!url) {
          lrcEl._times = [];
          renderNavLrc({ lines: [] });
          return;
        }
        if (lrcEl._url === url) {
          updateNavLrc(navPlayer.audio.currentTime);
          return;
        }
        lrcEl._url = url;
        fetch(url)
          .then(r => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
          .then(text => {
            const parsed = parseNavLrc(text);
            lrcEl._lines = parsed.lines;
            lrcEl._times = parsed.times;
            lrcEl._idx = -1;
            renderNavLrc(parsed);
            updateNavLrc(navPlayer.audio.currentTime);
          })
          .catch(() => {
            lrcEl._times = [];
            renderNavLrc({ lines: [] });
          });
      };

      navPlayer.on("listswitch", loadNavLrc);
      navPlayer.on("play", loadNavLrc);
      navPlayer.audio.addEventListener("timeupdate", function () {
        updateNavLrc(navPlayer.audio.currentTime);
      });
      loadNavLrc();

      // ===== 自绘横向音量条（原生弹出音量条被卡片裁剪且悬停即隐藏，改为常驻横条拖动）=====
      const navTimeEl = navMusicAplayer.querySelector(".aplayer-time");
      if (navTimeEl && !navTimeEl.querySelector(".nav-music-volume-bar")) {
        const volWrap = document.createElement("div");
        volWrap.className = "nav-music-volume-bar";
        volWrap.title = "音量";
        volWrap.innerHTML = '<div class="nav-music-volume-fill"></div>';
        navTimeEl.appendChild(volWrap);
        const volFill = volWrap.querySelector(".nav-music-volume-fill");
        const setVol = e => {
          const rect = volWrap.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          navPlayer.volume(ratio);
        };
        volWrap.addEventListener("mousedown", e => {
          e.preventDefault();
          setVol(e);
          const onMove = ev => setVol(ev);
          const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
          };
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        });
        const syncVol = () => {
          const v = navPlayer.audio.muted ? 0 : navPlayer.audio.volume;
          volFill.style.width = v * 100 + "%";
        };
        navPlayer.audio.addEventListener("volumechange", syncVol);
        syncVol();
      }

      // ===== 歌词块开关按钮（放控件行内与播放控件水平对齐，控制右侧歌词块显示/隐藏）=====
      if (navTimeEl && !navTimeEl.querySelector(".nav-music-lrc-toggle")) {
        const lrcToggle = document.createElement("button");
        lrcToggle.type = "button";
        lrcToggle.className = "nav-music-lrc-toggle active";
        lrcToggle.title = "歌词显示";
        lrcToggle.setAttribute("aria-label", "歌词显示开关");
        lrcToggle.innerHTML =
          '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6zm-6 8h4v2H6v-2zm-2 4h6v2H4v-2z"/></svg>';
        navTimeEl.appendChild(lrcToggle);
        lrcToggle.addEventListener("click", function () {
          const navMusicElNow = document.getElementById("nav-music");
          if (!navMusicElNow) return;
          navMusicElNow.classList.toggle("lrc-collapsed");
          lrcToggle.classList.toggle("active", !navMusicElNow.classList.contains("lrc-collapsed"));
        });
      }

      // ===== 展开/折叠按钮（紧贴卡片上边缘，_bound 防 pjax 重复绑定）=====
      const expandBtn = navMusicEl.querySelector(".nav-music-expand-btn");
      if (expandBtn && !expandBtn._bound) {
        expandBtn._bound = true;
        expandBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          anzhiyu.musicTelescopic();
        });
      }

      // 重建后重新绑定音乐区域点击事件（pjax destroy 后 DOM 与监听丢失；_bound 防重复绑定）
      const aplayerMusic = navMusicAplayer.querySelector(".aplayer-music");
      if (aplayerMusic && !aplayerMusic._bound) {
        aplayerMusic._bound = true;
        aplayerMusic.addEventListener("click", function () { anzhiyu.musicTelescopic(); });
      }
      const aplayerButton = navMusicAplayer.querySelector(".aplayer-button");
      if (aplayerButton && !aplayerButton._bound) {
        aplayerButton._bound = true;
        // changePaly=true：折叠态点击播放按钮真正切换播放/暂停
        aplayerButton.addEventListener("click", function () { anzhiyu.musicToggle(true); });
      }
      anzhiyu_musicFirst = true;
      // 重建后重新绑定 play/pause 状态同步（pjax destroy 后会丢失原监听）
      let msgPlay = '<i class="anzhiyufont anzhiyu-icon-play"></i><span>播放音乐</span>';
      let msgPause = '<i class="anzhiyufont anzhiyu-icon-pause"></i><span>暂停音乐</span>';
      navPlayer.on("pause", function () {
        const navMusicElNow = document.getElementById("nav-music");
        if (!navMusicElNow) return;
        navMusicElNow.classList.remove("playing");
        document.getElementById("menu-music-toggle").innerHTML = msgPlay;
        document.getElementById("nav-music-hoverTips").innerHTML = "音乐已暂停";
        document.querySelector("#consoleMusic").classList.remove("on");
        anzhiyu_musicPlaying = false;
        navMusicElNow.classList.remove("stretch");
      });
      navPlayer.on("play", function () {
        const navMusicElNow = document.getElementById("nav-music");
        if (!navMusicElNow) return;
        navMusicElNow.classList.add("playing");
        document.getElementById("menu-music-toggle").innerHTML = msgPause;
        document.querySelector("#consoleMusic").classList.add("on");
        anzhiyu_musicPlaying = true;
      });
    } catch (e) {}
  },

  //获取音乐中的名称
  musicGetName: function () {
    var x = document.querySelectorAll(".aplayer-title");
    var arr = [];
    for (var i = x.length - 1; i >= 0; i--) {
      arr[i] = x[i].innerText;
    }
    return arr[0];
  },

  //初始化console图标
  initConsoleState: function () {
    //初始化隐藏边栏
    const $htmlDomClassList = document.documentElement.classList;
    $htmlDomClassList.contains("hide-aside")
      ? document.querySelector("#consoleHideAside").classList.add("on")
      : document.querySelector("#consoleHideAside").classList.remove("on");
  },

  // 显示打赏中控台
  rewardShowConsole: function () {
    // 判断是否为赞赏打开控制台
    consoleEl.classList.add("reward-show");
    anzhiyu.initConsoleState();
  },
  // 显示中控台
  showConsole: function () {
    consoleEl.classList.add("show");
    anzhiyu.initConsoleState();
  },

  //隐藏中控台
  hideConsole: function () {
    if (consoleEl.classList.contains("show")) {
      // 如果是一般控制台，就关闭一般控制台
      consoleEl.classList.remove("show");
    } else if (consoleEl.classList.contains("reward-show")) {
      // 如果是打赏控制台，就关闭打赏控制台
      consoleEl.classList.remove("reward-show");
    }
    // 获取center-console元素
    const centerConsole = document.getElementById("center-console");

    // 检查center-console是否被选中
    if (centerConsole.checked) {
      // 取消选中状态
      centerConsole.checked = false;
    }
  },
  // 取消加载动画
  hideLoading: function () {
    document.getElementById("loading-box").classList.add("loaded");
  },
  // 将音乐缓存播放
  cacheAndPlayMusic() {
    let data = localStorage.getItem("musicData");
    if (data) {
      data = JSON.parse(data);
      const currentTime = new Date().getTime();
      if (currentTime - data.timestamp < 24 * 60 * 60 * 1000) {
        // 如果缓存的数据没有过期，直接使用
        anzhiyu.playMusic(data.songs);
        return;
      }
    }

    // 否则重新从服务器获取数据
    fetch("/json/music.json")
      .then(response => response.json())
      .then(songs => {
        const cacheData = {
          timestamp: new Date().getTime(),
          songs: songs,
        };
        localStorage.setItem("musicData", JSON.stringify(cacheData));
        anzhiyu.playMusic(songs);
      });
  },
  // 播放音乐
  playMusic(songs) {
    const anMusicPage = document.getElementById("anMusic-page");
    const metingAplayer = anMusicPage.querySelector("meting-js").aplayer;
    const randomIndex = Math.floor(Math.random() * songs.length);
    const randomSong = songs[randomIndex];
    const allAudios = metingAplayer.list.audios;
    if (!selectRandomSong.includes(randomSong.name)) {
      // 如果随机到的歌曲已经未被随机到过，就添加进metingAplayer.list
      metingAplayer.list.add([randomSong]);
      // 播放最后一首(因为是添加到了最后)
      metingAplayer.list.switch(allAudios.length);
      // 添加到已被随机的歌曲列表
      selectRandomSong.push(randomSong.name);
    } else {
      // 随机到的歌曲已经在播放列表中了
      // 直接继续随机直到随机到没有随机过的歌曲，如果全部随机过了就切换到对应的歌曲播放即可
      let songFound = false;
      while (!songFound) {
        const newRandomIndex = Math.floor(Math.random() * songs.length);
        const newRandomSong = songs[newRandomIndex];
        if (!selectRandomSong.includes(newRandomSong.name)) {
          metingAplayer.list.add([newRandomSong]);
          metingAplayer.list.switch(allAudios.length);
          selectRandomSong.push(newRandomSong.name);
          songFound = true;
        }
        // 如果全部歌曲都已被随机过，跳出循环
        if (selectRandomSong.length === songs.length) {
          break;
        }
      }
      if (!songFound) {
        // 如果全部歌曲都已被随机过，切换到对应的歌曲播放
        const palyMusicIndex = allAudios.findIndex(song => song.name === randomSong.name);
        if (palyMusicIndex != -1) metingAplayer.list.switch(palyMusicIndex);
      }
    }

    console.info("已随机歌曲：", selectRandomSong, "本次随机歌曲：", randomSong.name);
  },
  // 音乐节目切换背景
  changeMusicBg: function (isChangeBg = true) {
    const anMusicBg = document.getElementById("an_music_bg");

    if (isChangeBg) {
      // player listswitch 会进入此处
      const musiccover = document.querySelector("#anMusic-page .aplayer-pic");
      anMusicBg.style.backgroundImage = musiccover.style.backgroundImage;
    } else {
      // 第一次进入，绑定事件，改背景
      let timer = setInterval(() => {
        const musiccover = document.querySelector("#anMusic-page .aplayer-pic");
        // 确保player加载完成
        if (musiccover) {
          clearInterval(timer);
          // 绑定事件
          anzhiyu.addEventListenerMusic();
          // 确保第一次能够正确替换背景
          anzhiyu.changeMusicBg();

          // 暂停nav的音乐
          const navMusicPlayer = anzhiyu.getNavMusicPlayer();
          if (navMusicPlayer.audio && !navMusicPlayer.audio.paused) {
            anzhiyu.musicToggle();
          }
        }
      }, 100);
    }
  },
  // 获取自定义播放列表
  getCustomPlayList: function () {
    if (!window.location.pathname.startsWith("/music/")) {
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const userId = "1755942982";
    const userServer = "tencent";
    const anMusicPageMeting = document.getElementById("anMusic-page-meting");
    if (urlParams.get("id") && urlParams.get("server")) {
      const id = urlParams.get("id");
      const server = urlParams.get("server");
      anMusicPageMeting.innerHTML = `<meting-js id="${id}" server=${server} type="playlist" type="playlist" mutex="true" preload="auto" theme="var(--anzhiyu-main)" order="list" list-max-height="calc(100vh - 169px)!important"></meting-js>`;
    } else {
      anMusicPageMeting.innerHTML = `<meting-js id="${userId}" server="${userServer}" type="playlist" mutex="true" preload="auto" theme="var(--anzhiyu-main)" order="list" list-max-height="calc(100vh - 169px)!important"></meting-js>`;
    }
    anzhiyu.changeMusicBg(false);
  },
  //隐藏今日推荐
  hideTodayCard: function () {
    if (document.getElementById("todayCard")) {
      document.getElementById("todayCard").classList.add("hide");
      const topGroup = document.querySelector(".topGroup");
      const recentPostItems = topGroup.querySelectorAll(".recent-post-item");
      recentPostItems.forEach(item => {
        item.style.display = "flex";
      });
    }
  },

  // 监听音乐背景改变
  addEventListenerMusic: function () {
    const anMusicPage = document.getElementById("anMusic-page");
    const aplayerIconMenu = anMusicPage.querySelector(".aplayer-info .aplayer-time .aplayer-icon-menu");
    const anMusicBtnGetSong = anMusicPage.querySelector("#anMusicBtnGetSong");
    const anMusicRefreshBtn = anMusicPage.querySelector("#anMusicRefreshBtn");
    const anMusicSwitchingBtn = anMusicPage.querySelector("#anMusicSwitching");
    const anMusicBtnFold = anMusicPage.querySelector("#anMusicBtnFold");
    const metingAplayer = anMusicPage.querySelector("meting-js").aplayer;
    // 右侧按钮组折叠/展开（默认折叠贴右墙，点击把手弹出）
    if (anMusicBtnFold) {
      anMusicBtnFold.addEventListener("click", function () {
        const open = anMusicPage.classList.toggle("music-actions-open");
        anMusicBtnFold.classList.toggle("fold-open", open);
      });
    }
    //初始化音量
    metingAplayer.volume(0.8, true);
    metingAplayer.on("loadeddata", function () {
      anzhiyu.changeMusicBg();
    });

    aplayerIconMenu.addEventListener("click", function () {
      document.getElementById("menu-mask").style.display = "block";
      document.getElementById("menu-mask").style.animation = "0.5s ease 0s 1 normal none running to_show";
      anMusicPage.querySelector(".aplayer.aplayer-withlist .aplayer-list").style.opacity = "1";
    });

    function anMusicPageMenuAask() {
      if (window.location.pathname != "/music/") {
        document.getElementById("menu-mask").removeEventListener("click", anMusicPageMenuAask);
        return;
      }

      anMusicPage.querySelector(".aplayer-list").classList.remove("aplayer-list-hide");
    }

    document.getElementById("menu-mask").addEventListener("click", anMusicPageMenuAask);

    // 监听增加单曲按钮
    anMusicBtnGetSong.addEventListener("click", () => {
      if (changeMusicListFlag) {
        const anMusicPage = document.getElementById("anMusic-page");
        const metingAplayer = anMusicPage.querySelector("meting-js").aplayer;
        const allAudios = metingAplayer.list.audios;
        const randomIndex = Math.floor(Math.random() * allAudios.length);
        // 随机播放一首
        metingAplayer.list.switch(randomIndex);
      } else {
        anzhiyu.cacheAndPlayMusic();
      }
    });
    anMusicRefreshBtn.addEventListener("click", () => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("musicData")) {
          localStorage.removeItem(key);
        }
      }
      anzhiyu.snackbarShow("已移除相关缓存歌曲");
    });
    anMusicSwitchingBtn.addEventListener("click", () => {
      anzhiyu.changeMusicList();
    });

    // 默认加载的歌单
    if (GLOBAL_CONFIG.music_page_default === "custom") {
      anzhiyu.changeMusicList();
    }

    // 监听键盘事件
    //空格控制音乐
    document.addEventListener("keydown", function (event) {
      //暂停开启音乐
      if (event.code === "Space") {
        event.preventDefault();
        metingAplayer.toggle();
      }
      //切换下一曲
      if (event.keyCode === 39) {
        event.preventDefault();
        metingAplayer.skipForward();
      }
      //切换上一曲
      if (event.keyCode === 37) {
        event.preventDefault();
        metingAplayer.skipBack();
      }
      //增加音量
      if (event.keyCode === 38) {
        if (musicVolume <= 1) {
          musicVolume += 0.1;
          metingAplayer.volume(musicVolume, true);
        }
      }
      //减小音量
      if (event.keyCode === 40) {
        if (musicVolume >= 0) {
          musicVolume += -0.1;
          metingAplayer.volume(musicVolume, true);
        }
      }
    });
  },
  // 切换歌单
  changeMusicList: async function () {
    const anMusicPage = document.getElementById("anMusic-page");
    const metingAplayer = anMusicPage.querySelector("meting-js").aplayer;
    const currentTime = new Date().getTime();
    // 自定义歌单列表（可扩展：name 为歌单名，url 为 json 数据源，metingApi 为 meting 接口）
    const customPlaylists = [
      { name: "YOASOBI", url: "/json/music-yoasobi.json" },
      { name: "周杰伦", url: "/json/music.json" },
    ];
    let songs = [];

    // 轮换：-1 默认歌单 → 0 YOASOBI → 1 周杰伦 → -1 默认歌单
    customPlaylistIndex = (customPlaylistIndex + 1) % (customPlaylists.length + 1);
    if (customPlaylistIndex >= customPlaylists.length) {
      customPlaylistIndex = -1;
    }
    changeMusicListFlag = customPlaylistIndex >= 0;

    if (customPlaylistIndex === -1) {
      songs = defaultPlayMusicList;
    } else {
      const customPlaylist = customPlaylists[customPlaylistIndex];
      // 保存当前默认播放列表，以使下次可以切换回来
      if (!defaultPlayMusicList.length) defaultPlayMusicList = metingAplayer.list.audios;
      // 每个歌单单独缓存（v2：数据结构变更后强制刷新旧缓存；缓存结构无效时自动重新获取）
      const cacheKey = "musicData_v2_" + customPlaylistIndex;
      const cacheData = JSON.parse(localStorage.getItem(cacheKey)) || { timestamp: 0 };
      const cacheValid =
        Array.isArray(cacheData.songs) &&
        cacheData.songs.length > 0 &&
        currentTime - cacheData.timestamp < 24 * 60 * 60 * 1000;
      if (cacheValid) {
        songs = cacheData.songs;
      } else {
        // 否则重新从服务器获取数据
        let response;
        if (customPlaylist.metingApi) {
          response = await fetch(customPlaylist.metingApi);
          const metingData = await response.json();
          songs = metingData.map(item => ({
            name: item.title || item.name,
            artist: item.author || item.artist,
            url: item.url,
            cover: item.pic || item.cover,
            lrc: item.lrc,
          }));
        } else {
          response = await fetch(customPlaylist.url);
          songs = await response.json();
        }
        if (!Array.isArray(songs)) songs = [];
        cacheData.timestamp = currentTime;
        cacheData.songs = songs;
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      }
    }

    // 提示当前歌单名（先清理可能残留的 Snackbar，再无条件弹出）
    const playlistNames = ["默认歌单", ...customPlaylists.map(item => item.name)];
    document.querySelectorAll(".snackbar-container").forEach(el => el.remove());
    anzhiyu.snackbarShow("已切换到歌单：" + playlistNames[customPlaylistIndex + 1]);

    // 清除当前播放列表并添加新的歌曲（异常不影响切换提示）
    try {
      metingAplayer.list.clear();
      if (Array.isArray(songs) && songs.length > 0) {
        metingAplayer.list.add(songs);
        // 强制重新加载新歌单第一首：add 后列表索引可能未变化，audio 与歌词仍停留在旧歌单首曲
        if (metingAplayer.list.index === 0 && songs.length > 1) {
          metingAplayer.list.switch(1);
        }
        metingAplayer.list.switch(0);
      }
    } catch (e) {
      console.error("[changeMusicList] 切换播放列表失败", e);
    }

    // 歌词竞态修复：旧歌单的异步歌词 XHR 晚到仍会覆盖新歌词（APlayer 只比对索引不比对歌曲），
    // 切换后对比实际歌词与当前歌曲歌词，不一致则清缓存强制重载
    const fixLyricsRace = () => {
      try {
        const anMusicPageNow = document.getElementById("anMusic-page");
        const metingNow = anMusicPageNow.querySelector("meting-js");
        const playerNow = metingNow && metingNow.aplayer;
        const idx = playerNow && playerNow.list ? playerNow.list.index : -1;
        const lrcUrl =
          idx >= 0 && playerNow.list.audios[idx] ? playerNow.list.audios[idx].lrc : "";
        const contents = anMusicPageNow.querySelector(".aplayer-lrc-contents");
        if (!lrcUrl || !playerNow.lrc || !contents) return;
        fetch(lrcUrl)
          .then(r => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
          .then(text => {
            const want = (playerNow.lrc.parse ? playerNow.lrc.parse(text) : [])
              .map(item => item[1])
              .join("|");
            const have = Array.from(contents.querySelectorAll("p"))
              .map(p => p.textContent)
              .join("|");
            if (want && have !== want) {
              playerNow.lrc.parsed = [];
              playerNow.lrc.container.innerHTML = "";
              playerNow.lrc.switch(idx);
            }
          })
          .catch(() => {});
      } catch (e) {}
    };
    setTimeout(fixLyricsRace, 1000);
    setTimeout(fixLyricsRace, 2500);
  },
  // 控制台音乐列表监听
  addEventListenerConsoleMusicList: function () {
    const navMusic = document.getElementById("nav-music");
    if (!navMusic) return;
    navMusic.addEventListener("click", e => {
      const aplayerList = navMusic.querySelector(".aplayer-list");
      const listBtn = navMusic.querySelector(
        "div.aplayer-info > div.aplayer-controller > div.aplayer-time.aplayer-time-narrow > button.aplayer-icon.aplayer-icon-menu svg"
      );
      if (e.target != listBtn && aplayerList.classList.contains("aplayer-list-hide")) {
        aplayerList.classList.remove("aplayer-list-hide");
      }
    });
  },
  // 监听按键 - 页码跳转
  toPage: function () {
    var toPageText = document.getElementById("toPageText"),
      toPageButton = document.getElementById("toPageButton"),
      pageNumbers = document.querySelectorAll(".page-number"),
      pageNumber = Number(toPageText.value);

    // 获取最大页码，确保在分页元素不存在或为空时有默认值
    var lastPageNumber = 1;
    if (pageNumbers && pageNumbers.length > 0) {
      // 遍历所有分页数字，找出最大值（避免分页显示不完整导致的问题）
      pageNumbers.forEach(function (el) {
        var num = Number(el.textContent);
        if (!isNaN(num) && num > lastPageNumber) {
          lastPageNumber = num;
        }
      });
    }

    if (!isNaN(pageNumber) && pageNumber >= 1 && Number.isInteger(pageNumber)) {
      // 确保页码不超过最大页码
      var targetPage = pageNumber > lastPageNumber ? lastPageNumber : pageNumber;
      var url = "/page/" + targetPage + "/#content-inner";
      toPageButton.href = targetPage === 1 ? "/" : url;
    } else {
      toPageButton.href = "javascript:void(0);";
    }
  },

  //删除多余的class
  removeBodyPaceClass: function () {
    document.body.className = "pace-done";
  },
  // 修改body的type类型以适配css
  setValueToBodyType: function () {
    const input = document.getElementById("page-type"); // 获取input元素
    const value = input.value; // 获取input的value值
    document.body.dataset.type = value; // 将value值赋值到body的type属性上
  },
  //匿名评论
  addRandomCommentInfo: function () {
    // 从形容词数组中随机取一个值
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];

    // 从蔬菜水果动物名字数组中随机取一个值
    const randomName = vegetablesAndFruits[Math.floor(Math.random() * vegetablesAndFruits.length)];

    // 将两个值组合成一个字符串
    const name = `${randomAdjective}${randomName}`;

    function dr_js_autofill_commentinfos() {
      var lauthor = [
          "#author",
          "input[name='comname']",
          "#inpName",
          "input[name='author']",
          "#ds-dialog-name",
          "#name",
          "input[name='nick']",
          "#comment_author",
        ],
        lmail = [
          "#mail",
          "#email",
          "input[name='commail']",
          "#inpEmail",
          "input[name='email']",
          "#ds-dialog-email",
          "input[name='mail']",
          "#comment_email",
        ],
        lurl = [
          "#url",
          "input[name='comurl']",
          "#inpHomePage",
          "#ds-dialog-url",
          "input[name='url']",
          "input[name='website']",
          "#website",
          "input[name='link']",
          "#comment_url",
        ];
      for (var i = 0; i < lauthor.length; i++) {
        var author = document.querySelector(lauthor[i]);
        if (author != null) {
          author.value = name;
          author.dispatchEvent(new Event("input"));
          author.dispatchEvent(new Event("change"));
          break;
        }
      }
      for (var j = 0; j < lmail.length; j++) {
        var mail = document.querySelector(lmail[j]);
        if (mail != null) {
          mail.value = visitorMail;
          mail.dispatchEvent(new Event("input"));
          mail.dispatchEvent(new Event("change"));
          break;
        }
      }
      return !1;
    }

    dr_js_autofill_commentinfos();
    var input = document.getElementsByClassName("el-textarea__inner")[0];
    input.focus();
    input.setSelectionRange(-1, -1);
  },

  // 跳转开往
  totraveling: function () {
    anzhiyu.snackbarShow(
      "即将跳转到「开往」项目的成员博客，不保证跳转网站的安全性和可用性",
      element => {
        element.style.opacity = 0;
        travellingsTimer && clearTimeout(travellingsTimer);
      },
      5000,
      "取消"
    );
    travellingsTimer = setTimeout(function () {
      window.open("https://www.travellings.cn/go.html", "_blank");
    }, "5000");
  },

  // 工具函数替换字符串
  replaceAll: function (e, n, t) {
    return e.split(n).join(t);
  },

  // 音乐绑定事件
  musicBindEvent: function () {
    const musicEl = document.querySelector("#nav-music .aplayer-music");
    const buttonEl = document.querySelector("#nav-music .aplayer-button");
    if (musicEl && !musicEl._bound) {
      musicEl._bound = true;
      musicEl.addEventListener("click", function () { anzhiyu.musicTelescopic(); });
    }
    if (buttonEl && !buttonEl._bound) {
      buttonEl._bound = true;
      // changePaly=true：点击播放按钮真正切换播放/暂停
      buttonEl.addEventListener("click", function () { anzhiyu.musicToggle(true); });
    }
  },

  // 判断是否是移动端
  hasMobile: function () {
    let isMobile = false;
    if (
      navigator.userAgent.match(
        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
      ) ||
      document.body.clientWidth < 800
    ) {
      // 移动端
      isMobile = true;
    }
    return isMobile;
  },

  // 创建二维码
  qrcodeCreate: function () {
    if (document.getElementById("qrcode")) {
      document.getElementById("qrcode").innerHTML = "";
      var qrcode = new QRCode(document.getElementById("qrcode"), {
        text: window.location.href,
        width: 250,
        height: 250,
        colorDark: "#000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    }
  },

  // 判断是否在el内
  isInViewPortOfOne: function (el) {
    if (!el) return;
    const viewPortHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    const offsetTop = el.offsetTop;
    const scrollTop = document.documentElement.scrollTop;
    const top = offsetTop - scrollTop;
    return top <= viewPortHeight;
  },
  //添加赞赏蒙版
  addRewardMask: function () {
    if (!document.querySelector(".reward-main")) return;
    document.querySelector(".reward-main").style.display = "flex";
    document.querySelector(".reward-main").style.zIndex = "102";
    document.getElementById("quit-box").style.display = "flex";
  },
  // 移除赞赏蒙版
  removeRewardMask: function () {
    if (!document.querySelector(".reward-main")) return;
    document.querySelector(".reward-main").style.display = "none";
    document.getElementById("quit-box").style.display = "none";
  },

  keyboardToggle: function () {
    const isKeyboardOn = anzhiyu_keyboard;

    if (isKeyboardOn) {
      const consoleKeyboard = document.querySelector("#consoleKeyboard");
      consoleKeyboard.classList.remove("on");
      anzhiyu_keyboard = false;
    } else {
      const consoleKeyboard = document.querySelector("#consoleKeyboard");
      consoleKeyboard.classList.add("on");
      anzhiyu_keyboard = true;
    }

    localStorage.setItem("keyboardToggle", isKeyboardOn ? "false" : "true");
  },
  rightMenuToggle: function () {
    if (window.oncontextmenu) {
      window.oncontextmenu = null;
    } else if (!window.oncontextmenu && oncontextmenuFunction) {
      window.oncontextmenu = oncontextmenuFunction;
    }
  },
  switchConsole: () => {
    // switch console
    const consoleEl = document.getElementById("console");
    //初始化隐藏边栏
    const $htmlDom = document.documentElement.classList;
    $htmlDom.contains("hide-aside")
      ? document.querySelector("#consoleHideAside").classList.add("on")
      : document.querySelector("#consoleHideAside").classList.remove("on");
    if (consoleEl.classList.contains("show")) {
      consoleEl.classList.remove("show");
    } else {
      consoleEl.classList.add("show");
    }
    const consoleKeyboard = document.querySelector("#consoleKeyboard");

    if (consoleKeyboard) {
      if (localStorage.getItem("keyboardToggle") === "true") {
        consoleKeyboard.classList.add("on");
        anzhiyu_keyboard = true;
      } else {
        consoleKeyboard.classList.remove("on");
        anzhiyu_keyboard = false;
      }
    }
  },
  // 定义 intersectionObserver 函数，并接收两个可选参数
  intersectionObserver: function (enterCallback, leaveCallback) {
    let observer;
    return () => {
      if (!observer) {
        observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.intersectionRatio > 0) {
              enterCallback?.();
            } else {
              leaveCallback?.();
            }
          });
        });
      } else {
        // 如果 observer 对象已经存在，则先取消对之前元素的观察
        observer.disconnect();
      }
      return observer;
    };
  },
  // CategoryBar滚动
  scrollCategoryBarToRight: function () {
    // 获取需要操作的元素
    const items = document.getElementById("catalog-list");
    const nextButton = document.getElementById("category-bar-next");

    // 检查元素是否存在
    if (items && nextButton) {
      const itemsWidth = items.clientWidth;

      // 判断是否已经滚动到最右侧
      if (items.scrollLeft + items.clientWidth + 1 >= items.scrollWidth) {
        // 滚动到初始位置并更新按钮内容
        items.scroll({
          left: 0,
          behavior: "smooth",
        });
        nextButton.innerHTML = '<i class="anzhiyufont anzhiyu-icon-angle-double-right"></i>';
      } else {
        // 滚动到下一个视图
        items.scrollBy({
          left: itemsWidth,
          behavior: "smooth",
        });
      }
    } else {
      console.error("Element(s) not found: 'catalog-list' and/or 'category-bar-next'.");
    }
  },
  // 分类条
  categoriesBarActive: function () {
    const urlinfo = decodeURIComponent(window.location.pathname);
    const $categoryBar = document.getElementById("category-bar");
    if (!$categoryBar) return;

    if (urlinfo === "/") {
      $categoryBar.querySelector("#首页").classList.add("select");
    } else {
      const pattern = /\/categories\/.*?\//;
      const patbool = pattern.test(urlinfo);
      if (!patbool) return;

      const nowCategorie = urlinfo.split("/")[2];
      $categoryBar.querySelector(`#${nowCategorie}`).classList.add("select");
    }
  },
  topCategoriesBarScroll: function () {
    const $categoryBarItems = document.getElementById("category-bar-items");
    if (!$categoryBarItems) return;

    $categoryBarItems.addEventListener("mousewheel", function (e) {
      const v = -e.wheelDelta / 2;
      this.scrollLeft += v;
      e.preventDefault();
    });
  },
  // 切换菜单显示热评
  switchRightClickMenuHotReview: function () {
    const postComment = document.getElementById("post-comment");
    const menuCommentBarrageDom = document.getElementById("menu-commentBarrage");
    if (postComment) {
      menuCommentBarrageDom.style.display = "flex";
    } else {
      menuCommentBarrageDom.style.display = "none";
    }
  },
  // 切换作者卡片状态文字
  changeSayHelloText: function () {
    const greetings = GLOBAL_CONFIG.authorStatus.skills;

    const authorInfoSayHiElement = document.getElementById("author-info__sayhi");

    // 如果只有一个问候语，设置为默认值
    if (greetings.length === 1) {
      authorInfoSayHiElement.textContent = greetings[0];
      return;
    }

    let lastSayHello = authorInfoSayHiElement.textContent;

    let randomGreeting = lastSayHello;
    while (randomGreeting === lastSayHello) {
      randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    }
    authorInfoSayHiElement.textContent = randomGreeting;
  },
};

const anzhiyuPopupManager = {
  queue: [],
  processing: false,
  Jump: false,

  enqueuePopup(title, tip, url, duration = 3000) {
    this.queue.push({ title, tip, url, duration });
    if (!this.processing) {
      this.processQueue();
    }
  },

  processQueue() {
    if (this.queue.length > 0 && !this.processing) {
      this.processing = true;
      const { title, tip, url, duration } = this.queue.shift();
      this.popupShow(title, tip, url, duration);
    }
  },

  popupShow(title, tip, url, duration) {
    const popupWindow = document.getElementById("popup-window");
    if (!popupWindow) return;
    const windowTitle = popupWindow.querySelector(".popup-window-title");
    const windowContent = popupWindow.querySelector(".popup-window-content");
    const cookiesTip = windowContent.querySelector(".popup-tip");
    if (popupWindow.classList.contains("show-popup-window")) {
      popupWindow.classList.add("popup-hide");
    }

    // 等待上一个弹窗完全消失
    setTimeout(() => {
      // 移除之前的点击事件处理程序
      popupWindow.removeEventListener("click", this.clickEventHandler);
      if (url) {
        if (window.pjax) {
          this.clickEventHandler = event => {
            event.preventDefault();
            pjax.loadUrl(url);
            popupWindow.classList.remove("show-popup-window");
            popupWindow.classList.remove("popup-hide");
            this.Jump = true;

            // 处理队列中的下一个弹出窗口
            this.processing = false;
            this.processQueue();
          };

          popupWindow.addEventListener("click", this.clickEventHandler);
        } else {
          this.clickEventHandler = () => {
            window.location.href = url;
          };
          popupWindow.addEventListener("click", this.clickEventHandler);
        }
        if (popupWindow.classList.contains("no-url")) {
          popupWindow.classList.remove("no-url");
        }
      } else {
        if (!popupWindow.classList.contains("no-url")) {
          popupWindow.classList.add("no-url");
        }

        this.clickEventHandler = () => {
          popupWindow.classList.add("popup-hide");
          setTimeout(() => {
            popupWindow.classList.remove("popup-hide");
            popupWindow.classList.remove("show-popup-window");
          }, 1000);
        };
        popupWindow.addEventListener("click", this.clickEventHandler);
      }

      if (popupWindow.classList.contains("popup-hide")) {
        popupWindow.classList.remove("popup-hide");
      }
      popupWindow.classList.add("show-popup-window");
      windowTitle.textContent = title;
      cookiesTip.textContent = tip;
    }, 800);

    setTimeout(() => {
      if (url && !this.Jump) {
        this.Jump = false;
      }
      if (!popupWindow.classList.contains("popup-hide") && popupWindow.className != "") {
        popupWindow.classList.add("popup-hide");
      }

      // 处理队列中的下一个弹出窗口
      this.processing = false;
      this.processQueue();
    }, duration);
  },
};
