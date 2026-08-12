(function () {
  const API_BASE = 'https://upload.weiguang.eu.org';
  const STORAGE_KEY = 'waline-upload-channel';
  const MIB = 1024 * 1024;

  let cachedChannels = null;

  const CHANNEL_LABELS = {
    telegram: 'Telegram',
    discord: 'Discord',
    cfr2: 'Cloudflare R2',
    s3: 'S3',
    huggingface: 'HuggingFace',
  };

  function formatBytes(bytes) {
    if (!bytes) return '';
    return bytes >= MIB ? `${Math.round(bytes / MIB)} MiB` : `${Math.round(bytes / 1024)} KiB`;
  }

  async function fetchChannels() {
    if (cachedChannels) return cachedChannels;
    try {
      const res = await fetch(`${API_BASE}/channels`);
      if (!res.ok) return null;
      const data = await res.json();
      cachedChannels = data;
      return data;
    } catch {
      return null;
    }
  }

  function createModal(channels, defaultChannel) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (value) => {
        if (settled) return;
        settled = true;
        dialog.close();
        dialog.remove();
        resolve(value);
      };

      const dialog = document.createElement('dialog');
      dialog.setAttribute('aria-label', '选择图片上传渠道');
      dialog.style.cssText = [
        'background:#fff', 'border-radius:12px', 'padding:20px',
        'max-width:340px', 'width:100%', 'box-shadow:0 8px 30px rgba(0,0,0,.2)',
        'font-size:14px', 'color:#333', 'max-height:80vh', 'overflow-y:auto',
        'border:none',
      ].join(';');
      const style = document.createElement('style');
      style.textContent = 'dialog::backdrop { background: rgba(0,0,0,.45); }';
      document.head.appendChild(style);
      dialog.addEventListener('cancel', () => done(null));
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) done(null);
      });

      const title = document.createElement('div');
      title.textContent = '选择图片上传渠道';
      title.style.cssText = 'font-size:15px;font-weight:600;margin-bottom:4px;';
      dialog.appendChild(title);

      const subtitle = document.createElement('div');
      subtitle.textContent = '不同渠道的存储位置与大小限制不同';
      subtitle.style.cssText = 'font-size:12px;color:#888;margin-bottom:12px;';
      dialog.appendChild(subtitle);

      const saved = (() => {
        try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
      })();
      const initial = channels.some((c) => c.name === saved) ? saved : defaultChannel;

      const list = document.createElement('div');
      list.setAttribute('role', 'radiogroup');
      list.setAttribute('aria-label', '上传渠道');
      dialog.appendChild(list);

      const optionEls = new Map();
      channels.forEach((channel, idx) => {
        const label = CHANNEL_LABELS[channel.name] || channel.name;
        const limit = formatBytes(channel.maxUploadBytes);
        const item = document.createElement('label');
        item.style.cssText = [
          'display:flex', 'align-items:center', 'gap:8px', 'padding:9px 10px',
          'border:1px solid #e3e3e3', 'border-radius:8px', 'margin-bottom:6px',
          'cursor:pointer', 'transition:border-color .15s',
        ].join(';');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'waline-upload-channel';
        radio.value = channel.name;
        radio.checked = channel.name === initial;
        radio.style.cssText = 'accent-color:#425aef;margin:0;flex-shrink:0;';

        const text = document.createElement('div');
        text.style.cssText = 'flex:1;min-width:0;';
        const name = document.createElement('div');
        name.textContent = label;
        name.style.cssText = 'font-weight:500;';
        text.appendChild(name);
        if (limit) {
          const cap = document.createElement('div');
          cap.textContent = `单文件上限 ${limit}`;
          cap.style.cssText = 'font-size:12px;color:#999;margin-top:1px;';
          text.appendChild(cap);
        }
        item.appendChild(radio);
        item.appendChild(text);
        item.addEventListener('click', () => {
          radio.checked = true;
          optionEls.forEach((v) => { v.style.borderColor = '#e3e3e3'; });
          item.style.borderColor = '#425aef';
        });
        list.appendChild(item);
        optionEls.set(channel.name, item);
        if (channel.name === initial) item.style.borderColor = '#425aef';
        if (idx === 0) item.style.marginTop = '0';
      });

      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:14px;';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = '取消';
      cancelBtn.style.cssText = [
        'padding:7px 14px', 'border-radius:8px', 'border:1px solid #e3e3e3',
        'background:#fff', 'cursor:pointer', 'font-size:13px', 'color:#666',
      ].join(';');
      cancelBtn.addEventListener('click', () => done(null));

      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.textContent = '上传';
      okBtn.style.cssText = [
        'padding:7px 16px', 'border-radius:8px', 'border:none',
        'background:#425aef', 'color:#fff', 'cursor:pointer', 'font-size:13px',
        'font-weight:500',
      ].join(';');
      okBtn.addEventListener('click', () => {
        const selected = list.querySelector('input:checked');
        done(selected ? selected.value : null);
      });

      actions.appendChild(cancelBtn);
      actions.appendChild(okBtn);
      dialog.appendChild(actions);

      document.body.appendChild(dialog);
      dialog.showModal();
      okBtn.focus();
    });
  }

  async function upload(file, channel) {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams({ uploadChannel: channel });
    const response = await fetch(`${API_BASE}/upload?${params}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok || !data?.[0]?.src) {
      throw new Error(data?.error || '图片上传失败');
    }
    return `https://img.weiguang.eu.org${data[0].src}`;
  }

  async function walineUploader(file) {
    const info = await fetchChannels();
    if (!info || !Array.isArray(info.channels) || info.channels.length === 0) {
      const fallback = (() => {
        try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
      })() || 'discord';
      return upload(file, fallback);
    }

    const channel = await createModal(info.channels, info.default || 'discord');
    if (!channel) {
      throw new Error('已取消上传');
    }
    try {
      localStorage.setItem(STORAGE_KEY, channel);
    } catch { /* ignore */ }
    return upload(file, channel);
  }

  window.WalineImageUploader = walineUploader;
})();
