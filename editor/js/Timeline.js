/**
 * @author mrdoob / http://mrdoob.com/
 */

import { TimelineAnimations } from "./TimelineAnimations.js";

function Timeline(editor) {
  var signals = editor.signals;
  var player = editor.player;

  var container = new UI.Panel();
  container.setId("timeline");

  // controls

  /*
	var buttons = new UI.Div();
	buttons.setPosition( 'absolute' );
	buttons.setTop( '5px' );
	buttons.setRight( '5px' );
	controls.add( buttons );

	var button = new UI.Button();
	button.setLabel( 'ANIMATIONS' );
	button.onClick( function () {

		elements.setDisplay( '' );
		curves.setDisplay( 'none' );

	 } );
	buttons.add( button );

	var button = new UI.Button();
	button.setLabel( 'CURVES' );
	button.setMarginLeft( '4px' );
	button.onClick( function () {

		scroller.style.background = '';

		elements.setDisplay( 'none' );
		curves.setDisplay( '' );

	} );
	buttons.add( button );
	*/

  // timeline

  var keysDown = {};
  document.addEventListener("keydown", function (event) {
    keysDown[event.keyCode] = true;
  });
  document.addEventListener("keyup", function (event) {
    keysDown[event.keyCode] = false;
  });

  var scale = 1;
  var prevScale = scale;

  var timeline = new UI.Panel();
  timeline.setPosition("absolute");
  timeline.setTop("0px");
  timeline.setBottom("0px");
  timeline.setWidth("100%");
  timeline.setOverflow("hidden");
  timeline.dom.addEventListener("wheel", function (event) {
    if (event.altKey === true) {
      event.preventDefault();
      scale = Math.min(10, Math.max(0.01, scale + event.deltaY / 10000));
      signals.timelineScaled.dispatch(scale);
    }
  });
  container.add(timeline);

  var canvas = document.createElement("canvas");
  canvas.height = 32;
  canvas.style.position = "absolute";
  canvas.addEventListener(
    "mousedown",
    function (event) {
      event.preventDefault();

      function onMouseMove(event) {
        editor.setTime((event.offsetX + scroller.scrollLeft) / (100 * scale));
      }

      function onMouseUp(event) {
        onMouseMove(event);

        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      document.addEventListener("mousemove", onMouseMove, false);
      document.addEventListener("mouseup", onMouseUp, false);
    },
    false
  );
  timeline.dom.appendChild(canvas);

  var waveform = document.createElement("canvas");
  waveform.style.top = "32px";
  waveform.style.position = "absolute";
  timeline.dom.appendChild(waveform);
  const waveCtx = waveform.getContext("2d");

  const request = new XMLHttpRequest();

  request.open("GET", "./assets/track.mp3", true);
  request.responseType = "arraybuffer";

  let waveBuffer;

  request.onload = function () {
    var audioData = request.response;
    var offlineCtx = new OfflineAudioContext(2, 44100 * 40, 44100);
    offlineCtx.decodeAudioData(audioData, (buffer) => {
      waveBuffer = buffer;
      updateWavefrom();
    });
    offlineCtx.startRendering();
  };
  request.send();

  function updateWavefrom() {
    if (!waveBuffer) {
      return;
    }

    const w = scroller.clientWidth;
    const h = 32;
    waveform.width = w * window.devicePixelRatio;
    waveform.height = h * window.devicePixelRatio;
    waveform.style.width = `${w}px`;
    waveform.style.height = `${h}px`;

    waveCtx.save();
    waveCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

    waveCtx.fillStyle = "#88f";
    const factor = 441 / scale; // Seems to be related to freq.
    var data = waveBuffer.getChannelData(0);
    var step = Math.ceil(factor);
    const offset = Math.round((scroller.scrollLeft * 44100) / (100 * scale));
    var amp = h / 2;
    for (var i = 0; i < w; i++) {
      var min = 1.0;
      var max = -1.0;
      for (var j = 0; j < step; j++) {
        var datum = data[offset + i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      waveCtx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }

    waveCtx.restore();
  }

  function updateMarks() {
    const w = scroller.clientWidth;
    const h = 32;
    canvas.width = w * window.devicePixelRatio;
    canvas.style.width = `${w}px`;
    canvas.height = h * window.devicePixelRatio;
    canvas.style.height = `${h}px`;

    var context = canvas.getContext("2d", { alpha: false });
    context.scale(window.devicePixelRatio, window.devicePixelRatio);

    context.fillStyle = "#555";
    context.fillRect(0, 0, w, h);

    context.strokeStyle = "#888";
    context.beginPath();

    const secondMinWidth = 100;
    const minWidth = 40;
    const secondsStep = scale * secondMinWidth;
    const stride = Math.ceil(minWidth / secondsStep);
    let stride2 = (stride * secondsStep) / 10;
    if (stride2 > 20) {
      stride2 = (stride * secondsStep) / 20;
    }

    const start = -scroller.scrollLeft % (scale * secondMinWidth);
    for (var i = start; i <= w; i += stride * secondsStep) {
      context.moveTo(i, 18);
      context.lineTo(i, 26);

      for (let j = 0; j < stride * secondsStep; j += stride2) {
        context.moveTo(i + j, 22);
        context.lineTo(i + j, 26);
      }
    }

    context.stroke();

    context.font = `${6 * window.devicePixelRatio}px Arial`;
    context.fillStyle = "#888";
    context.textAlign = "center";

    var step = Math.max(1, Math.floor(64 / scale));

    for (var i = start; i < w; i += stride * secondsStep) {
      const t = (i + scroller.scrollLeft) / (secondMinWidth * scale);
      var minute = Math.floor(t / 60);
      var second = Math.floor(t % 60);

      const minutes = minute > 9 ? minute : `0${minute}`;
      const seconds = second > 9 ? second : `0${second}`;
      var text = `${minutes}:${seconds}`;

      context.fillText(text, i, 13);
    }
  }

  var scroller = document.createElement("div");
  scroller.style.position = "absolute";
  scroller.style.top = "64px";
  scroller.style.bottom = "0px";
  scroller.style.width = "100%";
  scroller.style.overflow = "auto";
  scroller.addEventListener(
    "scroll",
    function (event) {
      updateMarks();
      updateWavefrom();
      updateTimeMark();
    },
    false
  );
  timeline.dom.appendChild(scroller);

  var elements = new TimelineAnimations(editor);
  scroller.appendChild(elements.dom);

  /*
	var curves = new Timeline.Curves( editor );
	curves.setDisplay( 'none' );
	scroller.appendChild( curves.dom );
	*/

  function updateContainers() {
    var width = editor.duration * scale * 100;

    elements.setWidth(width + "px");
    // curves.setWidth( width + 'px' );
  }

  //

  var loopMark = document.createElement("div");
  loopMark.style.position = "absolute";
  loopMark.style.top = 0;
  loopMark.style.height = 100 + "%";
  loopMark.style.width = 0;
  loopMark.style.background = "rgba( 255, 255, 255, 0.1 )";
  loopMark.style.pointerEvents = "none";
  loopMark.style.display = "none";
  timeline.dom.appendChild(loopMark);

  var timeMark = document.createElement("div");
  timeMark.style.position = "absolute";
  timeMark.style.top = "0px";
  timeMark.style.left = "-8px";
  timeMark.style.width = "16px";
  timeMark.style.height = "100%";
  timeMark.style.background =
    "linear-gradient(90deg, transparent 8px, #f00 8px, #f00 9px, transparent 9px) 0% 0% / 16px 16px repeat-y";
  timeMark.style.pointerEvents = "none";
  timeMark.style.marginTop = "16px";
  timeMark.appendChild(createTimeMarkImage());
  timeline.dom.appendChild(timeMark);

  var timeMarkText = document.createElement("p");
  timeMarkText.style.position = "absolute";
  timeMarkText.style.top = "0px";
  timeMarkText.style.background = "white";
  timeMarkText.style.padding = "2px";
  timeMarkText.style.fontSize = "10px";
  timeMarkText.style.pointerEvents = "none";
  timeline.dom.appendChild(timeMarkText);

  function createTimeMarkImage() {
    var canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;

    var context = canvas.getContext("2d");
    context.fillStyle = "#f00";
    context.beginPath();
    context.moveTo(2, 0);
    context.lineTo(14, 0);
    context.lineTo(14, 10);
    context.lineTo(8, 16);
    context.lineTo(2, 10);
    context.lineTo(2, 0);
    context.fill();

    return canvas;
  }

  function updateTimeMark() {
    var offsetLeft = player.currentTime * scale * 100 - scroller.scrollLeft - 8;

    timeMark.style.left = `${offsetLeft}px`;
    timeMarkText.style.left = `${offsetLeft}px`;
    timeMarkText.textContent = player.currentTime;

    /*

		if ( editor.player.isPlaying ) {

			var timelineWidth = timeline.dom.offsetWidth - 8;

			// Auto-scroll if end is reached

			if ( offsetLeft > timelineWidth ) {

				scroller.scrollLeft += timelineWidth;

			}

		}

		*/

    // TODO Optimise this

    var loop = player.getLoop();

    if (Array.isArray(loop)) {
      var loopStart = loop[0] * scale;
      var loopEnd = loop[1] * scale;

      loopMark.style.display = "";
      loopMark.style.left = loopStart - scroller.scrollLeft + "px";
      loopMark.style.width = loopEnd - loopStart + "px";
    } else {
      loopMark.style.display = "none";
    }
  }

  // signals

  signals.timeChanged.add(function () {
    updateTimeMark();
  });

  signals.timelineScaled.add(function (value) {
    scale = value;

    scroller.scrollLeft = (scroller.scrollLeft * value) / prevScale;

    updateMarks();
    updateTimeMark();
    updateContainers();
    updateWavefrom();

    prevScale = value;
  });

  signals.windowResized.add(function () {
    updateMarks();
    updateContainers();
    updateWavefrom();
  });

  return container;
}

export { Timeline };
