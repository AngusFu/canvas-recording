class AudioPlay {
  constructor(url) {
    const el = document.createElement("audio");
    el.src = url;
    el.muted = false;
    el.crossOrigin = "anonymous";

    this.el = el;
    this._ready = false;
  }

  ready(callback) {
    const onReady = () => {
      const stream = this.el.captureStream();
      const tracks = stream.getAudioTracks();

      callback({ stream, tracks });
      this._ready = true;
      this.el.oncanplay = null;
    };

    if (this._ready) {
      setTimeout(() => onReady());
    } else {
      this.el.oncanplay = () => onReady();
    }
  }

  play() {
    this.el.currentTime = 0;
    return this.el.play();
  }

  stop() {
    return this.el.pause();
  }
}

class CanvasRecorder {
  constructor(canvas, fps = 30) {
    const stream = canvas.captureStream(fps);

    this.dataChunks = [];
    this.stream = stream;
    this.recorder = new MediaRecorder(stream);

    this.recorder.addEventListener("dataavailable", (e) => {
      if (e.data.size > 0) {
        this.dataChunks.push(e.data);
      }
    });
  }

  start() {
    this.dataChunks = [];
    this.recorder.start();
  }

  stop() {
    return new Promise((resolve) => {
      this.recorder.onstop = resolve;
      this.recorder.stop();
    });
  }

  getObjectURL() {
    return URL.createObjectURL(new Blob(this.dataChunks));
  }
}

const btn = document.getElementById("button");
const stage = {
  video: document.getElementById("video"),

  init() {
    this.audio = new AudioPlay(
      "https://s4.ssl.qhres2.com/static/8cce395a1e99ad3f.mp3"
    );
    this.recorder = new CanvasRecorder(
      document.querySelector("#container > canvas")
    );

    return new Promise((resolve) => {
      this.audio.ready(({ tracks }) => {
        // 添加音轨
        this.recorder.stream.addTrack(tracks[0]);

        resolve();
      });
    });
  },

  start() {
    this.video.muted = true;
    this.video.hidden = false;
    this.video.autoplay = true;
    this.video.srcObject = null;
    this.video.controls = false;

    this.audio.play();
    this.recorder.start();

    setTimeout(() => {
      this.video.srcObject = this.recorder.stream;
    });
  },

  async stop() {
    this.audio.stop();
    await this.recorder.stop();
    this.video.muted = false;
    this.video.autoplay = false;
    this.video.srcObject = null;
    this.video.controls = true;
    this.video.src = this.recorder.getObjectURL();
  },
};

let playing = 0;
btn.onclick = function () {
  if (!playing) {
    stage.init().then(() => {
      stage.start();
      btn.textContent = "停止录制canvas";
    });
  } else {
    stage.stop();
    btn.textContent = "点击开始canvas动画并录制视频";
  }
  playing = (playing + 1) % 2;
};
