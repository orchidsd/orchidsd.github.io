(function () {
  // 首页顶部音乐播放器（参照前尘小筑魔改方案 https://mnchen.cn/posts/1017.html）
  const anzhiyuPlayerConfig = {
    playlistUrl: "/json/music-yoasobi.json", // 歌单数据（cdn.cbd.int 直链，含 mp3/lrc/cover）
    defaultCoverArt:
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    placeholderId: "custom-music-player-placeholder",
    playerUniquePrefix: "anzhiyuCustomPlayer",
    persistentPlayerContainerId: "anzhiyu-persistent-player-container",
    initializationFlag: "__anzhiyuPlayerInitialized",
  };

  const pfx = anzhiyuPlayerConfig.playerUniquePrefix;

  function resolveTrackUrl(u) {
    if (!u) return u;
    if (u.startsWith("http")) return u;
    return new URL(u, window.location.origin).href;
  }

  async function anzhiyuPlayerFetchPlaylist() {
    const globalState = window[anzhiyuPlayerConfig.initializationFlag];
    if (!globalState) return;
    const { songTitleElement, artistNameElement, coverArtImgElement, playlistContainerElement } = globalState;

    if (songTitleElement) songTitleElement.textContent = "正在加载歌单...";
    if (artistNameElement) artistNameElement.textContent = "";
    if (coverArtImgElement) coverArtImgElement.src = anzhiyuPlayerConfig.defaultCoverArt;
    if (playlistContainerElement) playlistContainerElement.innerHTML = `<div class="${pfx}-playlist-item">正在加载...</div>`;

    try {
      const response = await fetch(anzhiyuPlayerConfig.playlistUrl);
      if (!response.ok) throw new Error(`HTTP 请求错误! 状态: ${response.status}`);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        globalState.playlist = data;
        if (typeof anzhiyuPlayerPopulatePlaylistDisplay === "function") anzhiyuPlayerPopulatePlaylistDisplay();
        if (typeof anzhiyuPlayerLoadTrack === "function") anzhiyuPlayerLoadTrack(0);
      } else {
        globalState.playlist = [];
        if (songTitleElement) songTitleElement.textContent = "歌单为空";
        if (playlistContainerElement) playlistContainerElement.innerHTML = `<div class="${pfx}-playlist-item">歌单为空</div>`;
      }
    } catch (error) {
      if (songTitleElement) songTitleElement.textContent = "歌单加载失败";
      globalState.playlist = [];
      if (playlistContainerElement) playlistContainerElement.innerHTML = `<div class="${pfx}-playlist-item">加载失败</div>`;
    }
  }

  function anzhiyuPlayerLoadTrack(index, playImmediately = false) {
    const globalState = window[anzhiyuPlayerConfig.initializationFlag];
    if (!globalState) return;
    const { playlist, audioElement, songTitleElement, artistNameElement, coverArtImgElement } = globalState;

    if (!playlist || playlist.length === 0) {
      return;
    }
    if (index >= 0 && index < playlist.length) {
      globalState.currentTrackIndex = index;
      const track = playlist[index];

      if (songTitleElement) songTitleElement.textContent = track.name || track.title || "未知歌曲";
      if (artistNameElement) artistNameElement.textContent = track.artist || track.author || "未知艺术家";
      if (coverArtImgElement) coverArtImgElement.src = track.cover || track.pic || anzhiyuPlayerConfig.defaultCoverArt;

      if (audioElement) {
        const wasPlaying = !audioElement.paused && audioElement.currentTime > 0;
        const currentSrc = audioElement.currentSrc;
        const newSrc = resolveTrackUrl(track.url);

        if (currentSrc !== newSrc) {
          audioElement.src = newSrc;
          if (playImmediately || wasPlaying) {
            audioElement.load();
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {});
            }
          }
        } else if (playImmediately && audioElement.paused) {
          const playPromise = audioElement.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {});
          }
        }
      }
      if (typeof anzhiyuPlayerUpdatePlaylistActiveItem === "function") anzhiyuPlayerUpdatePlaylistActiveItem();
    }
    if (typeof loadTrackLyrics === "function") loadTrackLyrics();
  }

  function anzhiyuPlayerNextSong() {
    const globalState = window[anzhiyuPlayerConfig.initializationFlag];
    if (!globalState) return;
    const { playlist } = globalState;

    if (!playlist || playlist.length === 0) return;
    let newIndex = (globalState.currentTrackIndex + 1) % playlist.length;
    if (typeof anzhiyuPlayerLoadTrack === "function") anzhiyuPlayerLoadTrack(newIndex, true);
  }

  function anzhiyuPlayerPopulatePlaylistDisplay() {
    const globalState = window[anzhiyuPlayerConfig.initializationFlag];
    if (!globalState) return;
    const { playlistContainerElement, playlist } = globalState;

    if (!playlistContainerElement || !playlist || playlist.length === 0) {
      if (playlistContainerElement) playlistContainerElement.innerHTML = `<div class="${pfx}-playlist-item">歌单为空</div>`;
      return;
    }
    playlistContainerElement.innerHTML = "";

    playlist.forEach((track, index) => {
      const item = document.createElement("div");
      item.className = `${pfx}-playlist-item`;
      item.dataset.index = index;

      const trackNumber = document.createElement("span");
      trackNumber.className = `${pfx}-playlist-item-number`;
      trackNumber.textContent = (index + 1).toString().padStart(2, "0");

      const trackInfo = document.createElement("span");
      trackInfo.className = `${pfx}-playlist-item-info`;
      trackInfo.textContent = `${track.name || track.title || "未知歌曲"} - ${track.artist || track.author || "未知艺术家"}`;
      trackInfo.title = `${track.name || track.title || "未知歌曲"} - ${track.artist || track.author || "未知艺术家"}`;

      item.appendChild(trackNumber);
      item.appendChild(trackInfo);

      item.addEventListener("click", () => {
        if (typeof anzhiyuPlayerLoadTrack === "function") {
          anzhiyuPlayerLoadTrack(index, true);
        }
      });
      playlistContainerElement.appendChild(item);
    });
    anzhiyuPlayerUpdatePlaylistActiveItem();
  }

  function anzhiyuPlayerUpdatePlaylistActiveItem() {
    const globalState = window[anzhiyuPlayerConfig.initializationFlag];
    if (!globalState) return;
    const { playlistContainerElement, currentTrackIndex } = globalState;

    if (!playlistContainerElement) return;
    const items = playlistContainerElement.querySelectorAll(`.${pfx}-playlist-item`);

    items.forEach((item, index) => {
      if (index === currentTrackIndex) {
        item.classList.add(`${pfx}-playlist-item-active`);
      } else {
        item.classList.remove(`${pfx}-playlist-item-active`);
      }
    });
  }

  function handlePlayEvent() {
    const globalState = window[anzhiyuPlayerConfig.initializationFlag];
    if (globalState && globalState.coverArtImgElement) {
      globalState.coverArtImgElement.classList.add("rotating");
    }
  }
  function handlePauseEvent() {
    const globalState = window[anzhiyuPlayerConfig.initializationFlag];
    if (globalState && globalState.coverArtImgElement) {
      globalState.coverArtImgElement.classList.remove("rotating");
    }
  }

  function parseLrc(lrcText) {
    const lines = [];
    if (!lrcText) return lines;
    const regex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;
    const rawLines = lrcText.split(/\r?\n/);
    rawLines.forEach(rawLine => {
      let match;
      const timeMatches = [];
      while ((match = regex.exec(rawLine)) !== null) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const fraction = match[3] ? parseFloat("0." + match[3]) : 0;
        timeMatches.push(minutes * 60 + seconds + fraction);
      }
      if (timeMatches.length === 0) return;
      const text = rawLine.replace(regex, "").trim();
      timeMatches.forEach(t => {
        lines.push({ time: t, text: text });
      });
    });
    lines.sort((a, b) => a.time - b.time);
    return lines;
  }

  async function loadTrackLyrics() {
    const globalState = window[anzhiyuPlayerConfig.initializationFlag];
    if (!globalState || !globalState.lyricsInnerElement) return;
    const track = globalState.playlist[globalState.currentTrackIndex];
    const lrcRaw = track && (track.lrc || track.lyric);
    let lrcText = "";
    if (lrcRaw) {
      if (/^https?:\/\//i.test(lrcRaw)) {
        try {
          const resp = await fetch(lrcRaw);
          if (resp.ok) lrcText = await resp.text();
        } catch (e) {
          lrcText = "";
        }
      } else {
        lrcText = lrcRaw;
      }
    }
    const parsed = parseLrc(lrcText);
    globalState.trackLyrics = parsed;
    globalState.currentLyricsIndex = -1;
    globalState.lyricsContainerElement.classList.toggle(`${pfx}-lyrics-empty`, parsed.length === 0);
    if (parsed.length === 0) {
      globalState.lyricsInnerElement.innerHTML = `<div class="${pfx}-lyrics-line">暂无歌词</div>`;
      return;
    }
    globalState.lyricsInnerElement.innerHTML = parsed
      .map(l => `<div class="${pfx}-lyrics-line">${escapeHtml(l.text) || "♪"}</div>`)
      .join("");
    updateLyricsDisplay(globalState.audioElement ? globalState.audioElement.currentTime : 0);
  }

  function escapeHtml(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateLyricsDisplay(currentTime) {
    const globalState = window[anzhiyuPlayerConfig.initializationFlag];
    if (!globalState || !globalState.lyricsInnerElement) return;
    const { trackLyrics, lyricsContainerElement } = globalState;
    if (!trackLyrics || trackLyrics.length === 0) return;
    let activeIndex = -1;
    for (let i = trackLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= trackLyrics[i].time) {
        activeIndex = i;
        break;
      }
    }
    if (activeIndex === globalState.currentLyricsIndex) return;
    globalState.currentLyricsIndex = activeIndex;
    const lineEls = globalState.lyricsInnerElement.querySelectorAll(`.${pfx}-lyrics-line`);
    lineEls.forEach((el, i) => {
      el.classList.toggle(`${pfx}-lyrics-line-active`, i === activeIndex);
    });
    if (activeIndex >= 0) {
      globalState.lyricsInnerElement.style.transform = `translateY(${26 * 2 - activeIndex * 26}px)`;
    }
  }

  function initializeGlobalPlayer() {
    if (window[anzhiyuPlayerConfig.initializationFlag]) {
      return;
    }

    const anzhiyuPlayerState = (window[anzhiyuPlayerConfig.initializationFlag] = {});

    let persistentContainer = document.getElementById(anzhiyuPlayerConfig.persistentPlayerContainerId);
    if (!persistentContainer) {
      persistentContainer = document.createElement("div");
      persistentContainer.id = anzhiyuPlayerConfig.persistentPlayerContainerId;
      persistentContainer.style.display = "none";
      document.body.appendChild(persistentContainer);
    }

    let audioElement = document.getElementById(`${pfx}-audio-element`);
    if (!audioElement) {
      audioElement = document.createElement("audio");
      audioElement.id = `${pfx}-audio-element`;
      audioElement.controls = true;
    }
    anzhiyuPlayerState.audioElement = audioElement;

    let playerUIDiv = document.querySelector(`.${pfx}-player-container-v3`);
    if (!playerUIDiv) {
      playerUIDiv = persistentContainer.querySelector(`.${pfx}-player-container-v3`);
      if (!playerUIDiv) {
        playerUIDiv = document.createElement("div");
        playerUIDiv.className = `${pfx}-player-container-v3`;
        playerUIDiv.innerHTML = `
          <div class="${pfx}-left-column">
            <div id="${pfx}-cover-art-wrapper" class="${pfx}-cover-art-wrapper">
              <img id="${pfx}-cover-art-img" src="${anzhiyuPlayerConfig.defaultCoverArt}" alt="专辑封面">
            </div>
            <div class="${pfx}-song-info-left">
              <h2 id="${pfx}-song-title" style="width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></h2>
              <p id="${pfx}-artist-name" style="width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></p>
            </div>
          </div>
          <div class="${pfx}-right-column">
            <div id="${pfx}-playlist-container" class="${pfx}-playlist-container">
              <div class="${pfx}-playlist-item">正在加载...</div>
            </div>
            <div class="${pfx}-lyrics-container">
              <div class="${pfx}-lyrics-inner"></div>
            </div>
            <div class="${pfx}-controls-area"></div>
          </div>
        `;
      }
    }
    anzhiyuPlayerState.playerDOM = playerUIDiv;

    const controlsArea = playerUIDiv.querySelector(`.${pfx}-controls-area`);
    if (controlsArea) {
      if (audioElement.parentNode !== controlsArea) {
        controlsArea.appendChild(audioElement);
      }
    } else {
      if (audioElement.parentNode !== playerUIDiv) {
        playerUIDiv.appendChild(audioElement);
      }
    }

    if (playerUIDiv.parentNode !== persistentContainer) {
      persistentContainer.appendChild(playerUIDiv);
    }

    anzhiyuPlayerState.songTitleElement = playerUIDiv.querySelector(`#${pfx}-song-title`);
    anzhiyuPlayerState.artistNameElement = playerUIDiv.querySelector(`#${pfx}-artist-name`);
    anzhiyuPlayerState.playlistContainerElement = playerUIDiv.querySelector(`#${pfx}-playlist-container`);
    anzhiyuPlayerState.coverArtImgElement = playerUIDiv.querySelector(`#${pfx}-cover-art-img`);
    anzhiyuPlayerState.lyricsContainerElement = playerUIDiv.querySelector(`.${pfx}-lyrics-container`);
    anzhiyuPlayerState.lyricsInnerElement = playerUIDiv.querySelector(`.${pfx}-lyrics-inner`);

    if (!document.getElementById(`${pfx}-styles-v3`)) {
      const playerCSS = `
        #${anzhiyuPlayerConfig.persistentPlayerContainerId} { display: none; }
        .${pfx}-player-container-v3 { display: flex; height: 100%; box-sizing: border-box; padding: 15px; background-color: var(--anzhiyu-card-bg, white); box-shadow: var(--anzhiyu-shadow-border, 0 0 10px rgba(0,0,0,0.1)); border-radius: var(--anzhiyu-border-radius, 8px); color: var(--anzhiyu-fontcolor, black); gap: 20px; }
        .${pfx}-left-column { flex: 0 0 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .${pfx}-cover-art-wrapper { width: 170px; height: 170px; border-radius: 50%; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.25); margin-bottom: 15px; background-color: #e0e0e0; }
        #${pfx}-cover-art-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease-out; }
        #${pfx}-cover-art-img.rotating { animation: ${pfx}-rotate 15s linear infinite; }
        @keyframes ${pfx}-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .${pfx}-song-info-left { text-align: center; width: 100%; padding: 0 5px; }
        #${pfx}-song-title { font-size: 1.1em; margin: 0 0 4px 0; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--anzhiyu-fontcolor, black); display: block; max-width: 150px; }
        #${pfx}-artist-name { font-size: 0.85em; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--anzhiyu-second-fontcolor, gray); display: block; max-width: 150px; }
        .${pfx}-right-column { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .${pfx}-playlist-container { height: 200px; overflow-y: auto; border: 1px solid var(--anzhiyu-gray-c, #ddd); padding: 5px; border-radius: var(--anzhiyu-border-radius-small, 8px); background-color: var(--anzhiyu-background, #f9f9f9); margin-bottom: 10px; }
        .${pfx}-playlist-item { display: flex; align-items: center; padding: 6px 8px; margin-bottom: 3px; cursor: pointer; border-radius: 6px; transition: background-color 0.2s ease-in-out; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .${pfx}-playlist-item:hover { background-color: var(--anzhiyu-gray-a, #eee); }
        .${pfx}-playlist-item-active { background-color: var(--anzhiyu-theme-op, rgba(255, 102, 102, 0.15)); color: var(--anzhiyu-theme, #ff6666); font-weight: bold; }
        .${pfx}-playlist-item-number { font-size: 0.8em; color: var(--anzhiyu-third-fontcolor, #999); margin-right: 8px; min-width: 20px; text-align: right; }
        .${pfx}-playlist-item-active .${pfx}-playlist-item-number { color: var(--anzhiyu-theme, #ff6666); }
        .${pfx}-playlist-item-info { font-size: 0.9em; overflow: hidden; text-overflow: ellipsis; color: var(--anzhiyu-second-fontcolor, #555); }
        .${pfx}-playlist-item-active .${pfx}-playlist-item-info { color: var(--anzhiyu-theme, #ff6666); }
        .${pfx}-controls-area { margin-top: auto; }
        #${pfx}-audio-element { width: 100%; border-radius: 8px; display: block; }
        .${pfx}-lyrics-container { width: 100%; height: 110px; overflow: hidden; position: relative; border-radius: 8px; background: transparent; border: 1px solid transparent; padding: 6px 10px; }
        .${pfx}-lyrics-inner { display: flex; flex-direction: column; transition: transform .4s ease; will-change: transform; }
        .${pfx}-lyrics-line { height: 26px; line-height: 26px; font-size: 13px; color: var(--anzhiyu-third-fontcolor, #888); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color .3s; }
        .${pfx}-lyrics-line-active { color: var(--anzhiyu-theme, #ff6666); font-weight: 600; }
        .${pfx}-lyrics-empty { display: flex; align-items: center; justify-content: center; }
        @media (max-width: 768px) { .${pfx}-player-container-v3 { flex-direction: column; padding: 10px; gap: 10px; } .${pfx}-left-column { flex-basis: auto; width: 100%; padding-top: 5px; align-items: center; justify-content: flex-start; } .${pfx}-cover-art-wrapper { width: 130px; height: 130px; margin-bottom: 10px; } .${pfx}-right-column { width: 100%; } .${pfx}-playlist-container { font-size: 0.85em; height: 150px; } #${pfx}-song-title { font-size: 1em; } #${pfx}-artist-name { font-size: 0.75em; } .${pfx}-lyrics-container { width: 100%; } }
        @media (max-width: 991px) { #custom-music-player-placeholder { display: none !important; } #bannerGroup { width: 100% !important; margin-right: 0 !important; } }
        [data-theme="dark"] .${pfx}-player-container-v3 { background-color: #101010; border: 1px solid #2e2e2e; box-shadow: 0 0 14px rgba(0,0,0,0.6); }
        [data-theme="dark"] .${pfx}-cover-art-wrapper { background-color: #1f1f1f; border: 2px solid rgba(255, 102, 102, 0.45); box-shadow: 0 0 18px rgba(255, 102, 102, 0.22); }
        [data-theme="dark"] #${pfx}-song-title { color: #fff; }
        [data-theme="dark"] #${pfx}-artist-name { color: #aaa; }
        [data-theme="dark"] .${pfx}-playlist-container { border-color: #3a3a3a; background-color: #161616; scrollbar-color: #555 #161616; }
        [data-theme="dark"] .${pfx}-playlist-item { color: #d5d5d5; border-left: 3px solid transparent; }
        [data-theme="dark"] .${pfx}-playlist-item:hover { background-color: #2c2c2c; border-left-color: rgba(255, 102, 102, 0.55); }
        [data-theme="dark"] .${pfx}-playlist-item-info { color: #bbb; }
        [data-theme="dark"] .${pfx}-playlist-item-number { color: #777; }
        [data-theme="dark"] .${pfx}-playlist-item-active { background-color: rgba(255, 102, 102, 0.22); border-left-color: #ff6666; }
        [data-theme="dark"] .${pfx}-playlist-item-active .${pfx}-playlist-item-info,
        [data-theme="dark"] .${pfx}-playlist-item-active .${pfx}-playlist-item-number { color: #ff8a8a; font-weight: bold; }
        [data-theme="dark"] #${pfx}-audio-element { color-scheme: dark; }
        [data-theme="dark"] #${pfx}-audio-element::-webkit-media-controls-panel { background-color: #262626; }
        [data-theme="dark"] .${pfx}-lyrics-container { background: transparent; border: 1px solid transparent; }
        [data-theme="dark"] .${pfx}-lyrics-line { color: #8a8a8a; }
        [data-theme="dark"] .${pfx}-lyrics-line-active { color: #ff8a8a; }
      `;
      const styleElement = document.createElement("style");
      styleElement.type = "text/css";
      styleElement.id = `${pfx}-styles-v3`;
      styleElement.textContent = playerCSS;
      document.head.appendChild(styleElement);
    }

    if (anzhiyuPlayerState.audioElement) {
      const audioEl = anzhiyuPlayerState.audioElement;
      audioEl.removeEventListener("ended", anzhiyuPlayerNextSong);
      audioEl.removeEventListener("play", handlePlayEvent);
      audioEl.removeEventListener("playing", handlePlayEvent);
      audioEl.removeEventListener("pause", handlePauseEvent);

      audioEl.addEventListener("ended", anzhiyuPlayerNextSong);
      audioEl.addEventListener("play", handlePlayEvent);
      audioEl.addEventListener("playing", handlePlayEvent);
      audioEl.addEventListener("pause", handlePauseEvent);
      audioEl.addEventListener("timeupdate", () => updateLyricsDisplay(audioEl.currentTime));
    }

    anzhiyuPlayerFetchPlaylist();
  }

  function mountPlayerUI() {
    const globalState = window[anzhiyuPlayerConfig.initializationFlag];
    if (!globalState || !globalState.playerDOM) {
      return;
    }

    const placeholder = document.getElementById(anzhiyuPlayerConfig.placeholderId);
    const playerDOM = globalState.playerDOM;
    const persistentContainer = document.getElementById(anzhiyuPlayerConfig.persistentPlayerContainerId);

    if (!persistentContainer) {
      return;
    }

    if (placeholder) {
      if (playerDOM.parentNode !== placeholder) {
        placeholder.appendChild(playerDOM);
      }
    } else {
      if (playerDOM.parentNode !== persistentContainer) {
        persistentContainer.appendChild(playerDOM);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!window[anzhiyuPlayerConfig.initializationFlag]) {
      initializeGlobalPlayer();
    } else {
      const globalState = window[anzhiyuPlayerConfig.initializationFlag];
      if (globalState.playerDOM) {
        globalState.songTitleElement = globalState.playerDOM.querySelector(`#${pfx}-song-title`);
        globalState.artistNameElement = globalState.playerDOM.querySelector(`#${pfx}-artist-name`);
        globalState.playlistContainerElement = globalState.playerDOM.querySelector(`#${pfx}-playlist-container`);
        globalState.coverArtImgElement = globalState.playerDOM.querySelector(`#${pfx}-cover-art-img`);
        const audioElementInDOM = globalState.playerDOM.querySelector(`#${pfx}-audio-element`);
        if (audioElementInDOM) {
          globalState.audioElement = audioElementInDOM;
        }
      }
    }
    mountPlayerUI();
  });

  document.addEventListener("pjax:complete", () => {
    const globalState = window[anzhiyuPlayerConfig.initializationFlag];

    if (!globalState || !globalState.audioElement || !globalState.playerDOM) {
      if (typeof anzhiyuPlayerUpdatePlaylistActiveItem === "function") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            anzhiyuPlayerUpdatePlaylistActiveItem();
          });
        });
      }
      return;
    }

    let musicWasPlayingBeforePjax = !globalState.audioElement.paused;

    requestAnimationFrame(() => {
      mountPlayerUI();
      const currentPath = window.location.pathname;

      if (currentPath.startsWith("/music")) {
        if (!globalState.audioElement.paused) {
          globalState.audioElement.pause();
        }
      } else {
        if (musicWasPlayingBeforePjax && globalState.audioElement.paused) {
          const playPromise = globalState.audioElement.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {});
          }
        }
      }

      if (typeof anzhiyuPlayerUpdatePlaylistActiveItem === "function") {
        requestAnimationFrame(() => {
          anzhiyuPlayerUpdatePlaylistActiveItem();
        });
      }
    });
  });
})();
