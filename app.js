(() => {
  "use strict";

  const cfg = window.MUSIC_CONFIG || {};
  const $ = (id) => document.getElementById(id);

  const els = {
    app: $("app"),
    bg: $("backgroundLayer"),
    clock: $("clock"),
    listeners: $("listenerCount"),
    soundToggle: $("soundToggle"),
    soundIcon: $("soundIcon"),
    tagline: $("tagline"),
    playlistLabel: $("playlistLabel"),
    coverArt: $("coverArt"),
    title: $("trackTitle"),
    artist: $("trackArtist"),
    current: $("currentTime"),
    duration: $("duration"),
    fill: $("progressFill"),
    knob: $("progressKnob"),
    progressTrack: $("progressTrack"),
    playBtn: $("playBtn"),
    playIcon: $("playIcon"),
    prevBtn: $("prevBtn"),
    nextBtn: $("nextBtn"),
    repeatBtn: $("repeatBtn"),
    muteBtn: $("muteBtn"),
    volume: $("volumeSlider"),
    playlistPanel: $("playlistPanel"),
    playlistList: $("playlistList"),
    toast: $("toast"),
    youtubeHost: $("youtubeHost")
  };

  let player = null;
  let youtubeReady = false;
  let currentPlaylistIndex = 0;
  let repeat = false;
  let isMuted = false;
  let lastVolume = 80;
  let progressTimer = null;

  const fallbackBg = "images/default.svg";

  function random(arr) {
    return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2300);
  }

  function updateClock() {
    const now = new Date();
    els.clock.textContent = now.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).toLowerCase();
  }

  function setBackground() {
    const bg = random(cfg.backgrounds || []);
    if (bg) els.bg.style.backgroundImage =
      `url("${bg}"), linear-gradient(120deg,#173d63,#9d1d2c 55%,#120909)`;
  }

  function setTagline() {
    const line = random(cfg.taglines || []);
    if (line) els.tagline.textContent = line;
  }

  function renderPlaylists() {
    const lists = cfg.playlists || [];
    els.playlistList.innerHTML = "";

    if (!lists.length) {
      els.playlistList.innerHTML =
        '<div class="playlist-item"><b>No playlists configured</b><span>music-config/playlists.js edit karo.</span></div>';
      return;
    }

    lists.forEach((list, index) => {
      const btn = document.createElement("button");
      btn.className = "playlist-item" + (index === currentPlaylistIndex ? " selected" : "");
      btn.innerHTML = `<b>${escapeHtml(list.name || `Playlist ${index + 1}`)}</b>
                       <span>${escapeHtml(list.subtitle || "YouTube playlist")}</span>`;
      btn.addEventListener("click", () => {
        currentPlaylistIndex = index;
        loadPlaylist(index, true);
        renderPlaylists();
      });
      els.playlistList.appendChild(btn);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (m) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[m]));
  }

  function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
      youtubeReady = true;
      createPlayer();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      youtubeReady = true;
      createPlayer();
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  }

  function createPlayer() {
    if (player || !cfg.playlists?.length) return;

    const playlist = cfg.playlists[currentPlaylistIndex];
    if (!playlist || !playlist.id || playlist.id.includes("xxxx")) {
      els.title.textContent = "Add YouTube Playlist";
      els.artist.textContent = "music-config/playlists.js";
      toast("Pehle playlist ID add karo.");
      return;
    }

    const host = document.createElement("div");
    host.id = "yt-player";
    els.youtubeHost.appendChild(host);

    player = new YT.Player("yt-player", {
      width: "1",
      height: "1",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        listType: "playlist",
        list: playlist.id
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: () => toast("YouTube song load nahi ho paya.")
      }
    });
  }

  function onPlayerReady() {
    player.setVolume(Number(els.volume.value));
    if (cfg.shuffle) {
      try { player.setShuffle(true); } catch (_) {}
    }
    updatePlaylistLabel();
    updateMeta();
  }

  function loadPlaylist(index, shouldPlay = false) {
    if (!player) {
      currentPlaylistIndex = index;
      createPlayer();
      return;
    }

    const list = cfg.playlists[index];
    if (!list?.id) return;

    currentPlaylistIndex = index;
    try {
      player.loadPlaylist({
        list: list.id,
        listType: "playlist",
        index: 0,
        startSeconds: 0
      });
      if (cfg.shuffle) player.setShuffle(true);
      if (shouldPlay) player.playVideo();
    } catch (_) {}
    updatePlaylistLabel();
  }

  function updatePlaylistLabel() {
    const list = cfg.playlists?.[currentPlaylistIndex];
    els.playlistLabel.textContent = (list?.name || "RANDOM HIGHWAY MIX").toUpperCase();
  }

  function onPlayerStateChange(event) {
    if (!window.YT) return;

    if (event.data === YT.PlayerState.PLAYING) {
      els.app.classList.add("is-playing");
      els.playIcon.textContent = "Ⅱ";
      els.soundIcon.textContent = "Ⅱ";
      updateMeta();
      startProgress();
    } else if (event.data === YT.PlayerState.PAUSED) {
      els.app.classList.remove("is-playing");
      els.playIcon.textContent = "▶";
      els.soundIcon.textContent = "▶";
      stopProgress();
    } else if (event.data === YT.PlayerState.ENDED) {
      els.app.classList.remove("is-playing");
      stopProgress();
      if (repeat) {
        player.playVideo();
      } else if (cfg.autoplayNext) {
        nextTrack();
      }
    }

    setTimeout(updateMeta, 300);
  }

  function startProgress() {
    stopProgress();
    progressTimer = setInterval(updateProgress, 400);
  }

  function stopProgress() {
    clearInterval(progressTimer);
    progressTimer = null;
  }

  function updateProgress() {
    if (!player?.getCurrentTime) return;

    const current = Number(player.getCurrentTime()) || 0;
    const total = Number(player.getDuration()) || 0;
    const percent = total ? Math.min(100, (current / total) * 100) : 0;

    els.current.textContent = formatTime(current);
    els.duration.textContent = formatTime(total);
    els.fill.style.width = `${percent}%`;
    els.knob.style.left = `${percent}%`;
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const min = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return `${min}:${s}`;
  }

  function updateMeta() {
    if (!player?.getVideoData) return;
    try {
      const data = player.getVideoData();
      if (data?.title) els.title.textContent = data.title;
      els.artist.textContent = data?.author || "Rickshaw Radio";

      if (data?.video_id) {
        els.coverArt.src =
          `https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`;
      }
    } catch (_) {}
  }

  function playPause() {
    if (!player) {
      toast("Playlist configure karke page reload karo.");
      return;
    }

    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) player.pauseVideo();
    else player.playVideo();
  }

  function nextTrack() {
    if (!player) return;
    try {
      player.nextVideo();
      setTimeout(updateMeta, 500);
    } catch (_) {}
  }

  function prevTrack() {
    if (!player) return;
    try {
      player.previousVideo();
      setTimeout(updateMeta, 500);
    } catch (_) {}
  }

  function toggleMute() {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      player.setVolume(lastVolume);
      els.volume.value = lastVolume;
      els.muteBtn.textContent = "◖";
      isMuted = false;
    } else {
      lastVolume = Number(els.volume.value) || 80;
      player.mute();
      els.muteBtn.textContent = "×";
      isMuted = true;
    }
  }

  function seek(e) {
    if (!player?.getDuration) return;
    const rect = els.progressTrack.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    player.seekTo(ratio * player.getDuration(), true);
  }

  els.playBtn.addEventListener("click", playPause);
  els.soundToggle.addEventListener("click", playPause);
  els.nextBtn.addEventListener("click", nextTrack);
  els.prevBtn.addEventListener("click", prevTrack);
  els.muteBtn.addEventListener("click", toggleMute);
  els.progressTrack.addEventListener("click", seek);

  els.volume.addEventListener("input", (e) => {
    const value = Number(e.target.value);
    lastVolume = value;
    if (player) {
      player.unMute();
      player.setVolume(value);
      isMuted = false;
      els.muteBtn.textContent = "◖";
    }
  });

  els.repeatBtn.addEventListener("click", () => {
    repeat = !repeat;
    els.repeatBtn.style.opacity = repeat ? "1" : ".8";
    els.repeatBtn.style.background = repeat ? "rgba(255,255,255,.18)" : "transparent";
    toast(repeat ? "Repeat ON" : "Repeat OFF");
  });

  $("playlistBtn").addEventListener("click", () => {
    els.playlistPanel.classList.add("open");
  });

  $("closePlaylist").addEventListener("click", () => {
    els.playlistPanel.classList.remove("open");
  });

  $("shuffleBtn").addEventListener("click", () => {
    if (!player) return toast("Player ready nahi hai.");
    try {
      player.setShuffle(true);
      player.nextVideo();
      toast("Random song selected");
    } catch (_) {}
  });

  $("fullscreenBtn").addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {
      toast("Fullscreen browser ne allow nahi kiya.");
    }
  });

  $("homeBtn").addEventListener("click", () => {
    els.playlistPanel.classList.remove("open");
    setBackground();
    setTagline();
    toast("Welcome back to the highway");
  });

  // User interaction is required by most browsers before audio can start.
  document.addEventListener("click", () => {
    if (!player) return;
    try {
      if (player.getPlayerState() === YT.PlayerState.UNSTARTED) player.playVideo();
    } catch (_) {}
  }, { once: true });

  setInterval(updateClock, 1000);
  updateClock();

  // Demo highway listener count animation.
  setInterval(() => {
    const base = 631;
    const drift = Math.floor(Math.random() * 17) - 8;
    els.listeners.textContent = Math.max(1, base + drift);
  }, 3500);

  setBackground();
  setTagline();
  renderPlaylists();
  loadYouTubeAPI();
})();
