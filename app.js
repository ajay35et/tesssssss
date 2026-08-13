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

    closePlaylist: $("closePlaylist"),

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


  /* ==========================================
     SAFE EVENT HELPER
  ========================================== */

  function on(element, event, callback) {

    if (!element) return;

    element.addEventListener(
      event,
      callback
    );
  }


  /* ==========================================
     TOAST
  ========================================== */

  function toast(message) {

    if (!els.toast) return;

    els.toast.textContent = message;

    els.toast.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {

      els.toast.classList.remove("show");

    }, 2500);

  }


  /* ==========================================
     CLOCK
  ========================================== */

  function updateClock() {

    if (!els.clock) return;

    els.clock.textContent =
      new Date().toLocaleTimeString(
        "en-IN",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }
      ).toLowerCase();

  }


  /* ==========================================
     BACKGROUND
  ========================================== */

  function setBackground() {

    if (!els.bg) return;

    const backgrounds =
      cfg.backgrounds || [];

    if (!backgrounds.length) return;

    const image =
      backgrounds[
        Math.floor(
          Math.random() *
          backgrounds.length
        )
      ];

    els.bg.style.backgroundImage =
      `url("${image}")`;

  }


  /* ==========================================
     TAGLINE
  ========================================== */

  function setTagline() {

    if (!els.tagline) return;

    const taglines =
      cfg.taglines || [];

    if (!taglines.length) return;

    els.tagline.textContent =
      taglines[
        Math.floor(
          Math.random() *
          taglines.length
        )
      ];

  }


  /* ==========================================
     ESCAPE HTML
  ========================================== */

  function escapeHtml(value) {

    return String(value)
      .replace(
        /[&<>"']/g,
        (char) => {

          const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
          };

          return map[char];

        }
      );

  }


  /* ==========================================
     PLAYLIST LIST
  ========================================== */

  function renderPlaylists() {

    if (!els.playlistList) return;

    const playlists =
      cfg.playlists || [];

    els.playlistList.innerHTML = "";


    if (!playlists.length) {

      els.playlistList.innerHTML = `
        <div class="playlist-item">
          <b>No playlists configured</b>
          <span>Add playlist in music-config.js</span>
        </div>
      `;

      return;

    }


    playlists.forEach(
      (playlist, index) => {

        const button =
          document.createElement(
            "button"
          );

        button.className =
          "playlist-item" +
          (
            index ===
            currentPlaylistIndex
              ? " selected"
              : ""
          );


        button.innerHTML = `
          <b>
            ${escapeHtml(
              playlist.name ||
              `Playlist ${index + 1}`
            )}
          </b>

          <span>
            ${escapeHtml(
              playlist.subtitle ||
              "YouTube Playlist"
            )}
          </span>
        `;


        on(
          button,
          "click",
          () => {

            currentPlaylistIndex =
              index;

            loadPlaylist(
              index,
              true
            );

            renderPlaylists();

          }
        );


        els.playlistList.appendChild(
          button
        );

      }
    );

  }


  /* ==========================================
     YOUTUBE API
  ========================================== */

  function loadYouTubeAPI() {

    if (
      window.YT &&
      window.YT.Player
    ) {

      youtubeReady = true;

      createPlayer();

      return;

    }


    if (
      document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      )
    ) {

      return;

    }


    window.onYouTubeIframeAPIReady =
      function () {

        youtubeReady = true;

        createPlayer();

      };


    const script =
      document.createElement(
        "script"
      );

    script.src =
      "https://www.youtube.com/iframe_api";

    script.async = true;

    document.head.appendChild(
      script
    );

  }


  /* ==========================================
     CREATE PLAYER
  ========================================== */

  function createPlayer() {

    if (player) return;

    if (!youtubeReady) return;


    const playlists =
      cfg.playlists || [];


    if (!playlists.length) {

      toast(
        "No YouTube playlist configured"
      );

      return;

    }


    const playlist =
      playlists[
        currentPlaylistIndex
      ];


    if (
      !playlist ||
      !playlist.id
    ) {

      toast(
        "Invalid YouTube playlist ID"
      );

      return;

    }


    let host =
      document.getElementById(
        "yt-player"
      );


    if (!host) {

      host =
        document.createElement(
          "div"
        );

      host.id =
        "yt-player";


      /*
        Player ko display:none mat karo.
        YouTube iframe ko actual DOM
        size chahiye hota hai.
      */

      host.style.position =
        "fixed";

      host.style.width =
        "320px";

      host.style.height =
        "180px";

      host.style.left =
        "-10000px";

      host.style.top =
        "0";

      host.style.opacity =
        "0.01";

      host.style.pointerEvents =
        "none";


      if (els.youtubeHost) {

        els.youtubeHost.appendChild(
          host
        );

      } else {

        document.body.appendChild(
          host
        );

      }

    }


    player =
      new YT.Player(
        "yt-player",
        {

          width: "320",

          height: "180",


          playerVars: {

            autoplay: 0,

            controls: 0,

            playsinline: 1,

            rel: 0,

            modestbranding: 1,

            disablekb: 1,

            iv_load_policy: 3,

            listType:
              "playlist",

            list:
              playlist.id

          },


          events: {

            onReady:
              onPlayerReady,

            onStateChange:
              onPlayerStateChange,

            onError:
              onPlayerError

          }

        }
      );

  }


  /* ==========================================
     PLAYER READY
  ========================================== */

  function onPlayerReady() {

    console.log(
      "YouTube Player Ready"
    );


    if (!player) return;


    try {

      player.setVolume(
        Number(
          els.volume?.value ||
          80
        )
      );

    } catch (_) {}


    try {

      player.setShuffle(
        Boolean(
          cfg.shuffle
        )
      );

    } catch (_) {}


    updatePlaylistLabel();

    updateMeta();


    toast(
      "Playlist loaded"
    );

  }


  /* ==========================================
     LOAD PLAYLIST
  ========================================== */

  function loadPlaylist(
    index,
    playImmediately = false
  ) {

    const playlist =
      cfg.playlists?.[index];


    if (
      !playlist ||
      !playlist.id
    ) {

      toast(
        "Playlist ID invalid"
      );

      return;

    }


    currentPlaylistIndex =
      index;


    if (!player) {

      createPlayer();

      return;

    }


    try {

      console.log(
        "Loading playlist:",
        playlist.id
      );


      player.loadPlaylist({

        list:
          playlist.id,

        listType:
          "playlist",

        index:
          0,

        startSeconds:
          0

      });


      if (cfg.shuffle) {

        setTimeout(
          () => {

            try {

              player.setShuffle(
                true
              );

            } catch (_) {}

          },
          500
        );

      }


      if (playImmediately) {

        setTimeout(
          () => {

            try {

              player.playVideo();

            } catch (error) {

              console.error(
                "Play error:",
                error
              );

            }

          },
          800
        );

      }

    } catch (error) {

      console.error(
        "Playlist load error:",
        error
      );

      toast(
        "Playlist load failed"
      );

    }


    updatePlaylistLabel();

  }


  /* ==========================================
     PLAYLIST LABEL
  ========================================== */

  function updatePlaylistLabel() {

    if (!els.playlistLabel) return;

    const playlist =
      cfg.playlists?.[
        currentPlaylistIndex
      ];


    els.playlistLabel.textContent =
      (
        playlist?.name ||
        "RANDOM HIGHWAY MIX"
      ).toUpperCase();

  }


  /* ==========================================
     PLAYER STATE
  ========================================== */

  function onPlayerStateChange(
    event
  ) {

    if (!window.YT) return;


    if (
      event.data ===
      YT.PlayerState.PLAYING
    ) {

      els.app?.classList.add(
        "is-playing"
      );


      if (els.playIcon) {

        els.playIcon.textContent =
          "Ⅱ";

      }


      if (els.soundIcon) {

        els.soundIcon.textContent =
          "Ⅱ";

      }


      updateMeta();

      startProgress();

    }


    else if (
      event.data ===
      YT.PlayerState.PAUSED
    ) {

      els.app?.classList.remove(
        "is-playing"
      );


      if (els.playIcon) {

        els.playIcon.textContent =
          "▶";

      }


      if (els.soundIcon) {

        els.soundIcon.textContent =
          "▶";

      }


      stopProgress();

    }


    else if (
      event.data ===
      YT.PlayerState.ENDED
    ) {

      stopProgress();


      if (repeat) {

        try {

          player.playVideo();

        } catch (_) {}

      }

      else if (
        cfg.autoplayNext
      ) {

        nextTrack();

      }

    }


    else if (
      event.data ===
      YT.PlayerState.BUFFERING
    ) {

      if (els.title) {

        els.title.textContent =
          "Loading...";

      }

    }


    setTimeout(
      updateMeta,
      500
    );

  }


  /* ==========================================
     YOUTUBE ERROR
  ========================================== */

  function onPlayerError(event) {

    console.error(
      "YouTube error:",
      event.data
    );


    const messages = {

      2:
        "Invalid YouTube playlist/video",

      5:
        "YouTube HTML5 playback error",

      100:
        "Video unavailable",

      101:
        "Video embedding disabled",

      150:
        "Video embedding disabled"

    };


    toast(
      messages[event.data] ||
      "YouTube playback error"
    );

  }


  /* ==========================================
     PLAY / PAUSE
  ========================================== */

  function playPause() {

    if (!player) {

      toast(
        "Player abhi load ho raha hai..."
      );

      return;

    }


    try {

      const state =
        player.getPlayerState();


      if (
        state ===
        YT.PlayerState.PLAYING
      ) {

        player.pauseVideo();

      } else {

        player.playVideo();

      }

    } catch (error) {

      console.error(
        error
      );

    }

  }


  /* ==========================================
     NEXT
  ========================================== */

  function nextTrack() {

    if (!player) return;


    try {

      player.nextVideo();

      setTimeout(
        updateMeta,
        700
      );

    } catch (_) {}

  }


  /* ==========================================
     PREVIOUS
  ========================================== */

  function previousTrack() {

    if (!player) return;


    try {

      player.previousVideo();

      setTimeout(
        updateMeta,
        700
      );

    } catch (_) {}

  }


  /* ==========================================
     PROGRESS
  ========================================== */

  function startProgress() {

    stopProgress();

    progressTimer =
      setInterval(
        updateProgress,
        500
      );

  }


  function stopProgress() {

    if (progressTimer) {

      clearInterval(
        progressTimer
      );

      progressTimer = null;

    }

  }


  function updateProgress() {

    if (
      !player ||
      !player.getCurrentTime
    ) {

      return;

    }


    try {

      const current =
        Number(
          player.getCurrentTime()
        ) || 0;


      const total =
        Number(
          player.getDuration()
        ) || 0;


      const percentage =
        total
          ? (
              current /
              total
            ) * 100
          : 0;


      if (els.current) {

        els.current.textContent =
          formatTime(current);

      }


      if (els.duration) {

        els.duration.textContent =
          formatTime(total);

      }


      if (els.fill) {

        els.fill.style.width =
          `${percentage}%`;

      }


      if (els.knob) {

        els.knob.style.left =
          `${percentage}%`;

      }

    } catch (_) {}

  }


  function formatTime(seconds) {

    seconds =
      Math.floor(
        seconds || 0
      );


    const minutes =
      Math.floor(
        seconds / 60
      );


    const remaining =
      String(
        seconds % 60
      ).padStart(
        2,
        "0"
      );


    return (
      minutes +
      ":" +
      remaining
    );

  }


  /* ==========================================
     META
  ========================================== */

  function updateMeta() {

    if (
      !player ||
      !player.getVideoData
    ) {

      return;

    }


    try {

      const data =
        player.getVideoData();


      if (
        data?.title &&
        els.title
      ) {

        els.title.textContent =
          data.title;

      }


      if (els.artist) {

        els.artist.textContent =
          data?.author ||
          "Rickshaw Radio";

      }


      if (
        data?.video_id &&
        els.coverArt
      ) {

        els.coverArt.src =
          `https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`;

      }

    } catch (_) {}

  }


  /* ==========================================
     MUTE
  ========================================== */

  function toggleMute() {

    if (!player) return;


    try {

      if (isMuted) {

        player.unMute();

        player.setVolume(
          lastVolume
        );

        isMuted = false;

        toast(
          "Sound ON"
        );

      } else {

        lastVolume =
          Number(
            els.volume?.value ||
            80
          );

        player.mute();

        isMuted = true;

        toast(
          "Sound OFF"
        );

      }

    } catch (_) {}

  }


  /* ==========================================
     VOLUME
  ========================================== */

  on(
    els.volume,
    "input",
    (event) => {

      const value =
        Number(
          event.target.value
        );


      lastVolume =
        value;


      if (!player) return;


      try {

        player.unMute();

        player.setVolume(
          value
        );

        isMuted = false;

      } catch (_) {}

    }
  );


  /* ==========================================
     SEEK
  ========================================== */

  on(
    els.progressTrack,
    "click",
    (event) => {

      if (!player) return;


      try {

        const rect =
          els.progressTrack
            .getBoundingClientRect();


        const percentage =
          Math.max(
            0,
            Math.min(
              1,
              (
                event.clientX -
                rect.left
              ) /
              rect.width
            )
          );


        player.seekTo(
          percentage *
          player.getDuration(),
          true
        );

      } catch (_) {}

    }
  );


  /* ==========================================
     REPEAT
  ========================================== */

  on(
    els.repeatBtn,
    "click",
    () => {

      repeat =
        !repeat;


      if (els.repeatBtn) {

        els.repeatBtn.style.opacity =
          repeat
            ? "1"
            : ".8";

      }


      toast(
        repeat
          ? "Repeat ON"
          : "Repeat OFF"
      );

    }
  );


  /* ==========================================
     PLAY BUTTON
  ========================================== */

  on(
    els.playBtn,
    "click",
    playPause
  );


  /* ==========================================
     TOP PLAY BUTTON
  ========================================== */

  on(
    els.soundToggle,
    "click",
    playPause
  );


  /* ==========================================
     NEXT / PREVIOUS
  ========================================== */

  on(
    els.nextBtn,
    "click",
    nextTrack
  );


  on(
    els.prevBtn,
    "click",
    previousTrack
  );


  /* ==========================================
     MUTE BUTTON
  ========================================== */

  on(
    els.muteBtn,
    "click",
    toggleMute
  );


  /* ==========================================
     PLAYLIST PANEL
  ========================================== */

  on(
    $("playlistBtn"),
    "click",
    () => {

      els.playlistPanel?.classList.add(
        "open"
      );

    }
  );


  on(
    els.closePlaylist,
    "click",
    () => {

      els.playlistPanel?.classList.remove(
        "open"
      );

    }
  );


  /* ==========================================
     SHUFFLE
  ========================================== */

  on(
    $("shuffleBtn"),
    "click",
    () => {

      if (!player) {

        toast(
          "Player ready nahi hai."
        );

        return;

      }


      try {

        player.setShuffle(
          true
        );

        player.nextVideo();

        toast(
          "Random song selected"
        );

      } catch (_) {}

    }
  );


  /* ==========================================
     FULLSCREEN
  ========================================== */

  on(
    $("fullscreenBtn"),
    "click",
    async () => {

      try {

        if (
          !document.fullscreenElement
        ) {

          await document
            .documentElement
            .requestFullscreen();

        } else {

          await document.exitFullscreen();

        }

      } catch (_) {

        toast(
          "Fullscreen unavailable"
        );

      }

    }
  );


  /* ==========================================
     KEYBOARD
  ========================================== */

  document.addEventListener(
    "keydown",
    (event) => {

      const tag =
        document.activeElement?.tagName;


      if (
        tag === "INPUT" ||
        tag === "TEXTAREA"
      ) {

        return;

      }


      if (
        event.code ===
        "Space"
      ) {

        event.preventDefault();

        playPause();

      }


      if (
        event.code ===
        "ArrowRight"
      ) {

        nextTrack();

      }


      if (
        event.code ===
        "ArrowLeft"
      ) {

        previousTrack();

      }

    }
  );


  /* ==========================================
     INIT
  ========================================== */

  setInterval(
    updateClock,
    1000
  );

  updateClock();

  setBackground();

  setTagline();

  renderPlaylists();

  loadYouTubeAPI();

})();
