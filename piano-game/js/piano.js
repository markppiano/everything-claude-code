/**
 * Piano — Web Audio synth + on-screen key visuals.
 *
 * Notes are synthesized (triangle + sine, exponential decay) so there are
 * no audio files. Every press goes through Piano.press(), which plays the
 * note, animates the key, and notifies a single optional listener so the
 * game layer can score user input uniformly (mouse, touch, or keyboard).
 */
(function (global) {
	"use strict";

	var ctx = null;
	var master = null;
	var listener = null;
	var activeTimers = {};

	function audio() {
		if (!ctx) {
			var Ctor = global.AudioContext || global.webkitAudioContext;
			ctx = new Ctor();
			master = ctx.createGain();
			master.gain.value = 0.9;
			master.connect(ctx.destination);
		}
		return ctx;
	}

	function resumeAudio() {
		var c = audio();
		if (c.state === "suspended") {
			c.resume();
		}
		return c;
	}

	function tone(freq) {
		var c = audio();
		var t0 = c.currentTime;
		var dur = 1.25;

		var gain = c.createGain();
		gain.connect(master);

		var osc = c.createOscillator();
		osc.type = "triangle";
		osc.frequency.value = freq;

		var partial = c.createOscillator();
		partial.type = "sine";
		partial.frequency.value = freq * 2;
		var partialGain = c.createGain();
		partialGain.gain.value = 0.18;
		partial.connect(partialGain).connect(gain);

		osc.connect(gain);

		var peak = 0.32;
		gain.gain.setValueAtTime(0.0001, t0);
		gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
		gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

		osc.start(t0);
		partial.start(t0);
		osc.stop(t0 + dur + 0.02);
		partial.stop(t0 + dur + 0.02);
	}

	function el(keyId) {
		return document.getElementById(keyId);
	}

	function animate(keyId) {
		var node = el(keyId);
		if (!node) { return; }
		node.classList.add("active");
		if (activeTimers[keyId]) {
			clearTimeout(activeTimers[keyId]);
		}
		activeTimers[keyId] = setTimeout(function () {
			node.classList.remove("active");
			delete activeTimers[keyId];
		}, 160);
	}

	/**
	 * Play a key.
	 * @param {string} keyId  DOM id, e.g. "keyC".
	 * @param {string} source "mouse" | "key" | "auto". "auto" (listen/demo
	 *                        playback) is not reported to the game listener.
	 */
	function press(keyId, source) {
		var key = global.MusicKey.byId(keyId);
		if (!key) { return; }
		resumeAudio();
		tone(key.frequency);
		animate(keyId);
		if (source !== "auto" && typeof listener === "function") {
			listener(keyId, source || "mouse");
		}
	}

	function cue(keyId, on) {
		var node = el(keyId);
		if (!node) { return; }
		node.classList.toggle("cue", !!on);
	}

	function clearCues() {
		global.MusicKey.KEYS.forEach(function (k) { cue(k.id, false); });
	}

	function bindPointer() {
		var piano = document.getElementById("piano");
		if (!piano) { return; }
		piano.addEventListener("pointerdown", function (ev) {
			var keyEl = ev.target.closest(".key, .sharp");
			if (!keyEl || !keyEl.id) { return; }
			ev.preventDefault();
			press(keyEl.id, "mouse");
		});
	}

	function decorateLabels() {
		global.MusicKey.KEYS.forEach(function (k) {
			var node = el(k.id);
			if (!node) { return; }
			var hint = global.KeyCode.labelFor(k.id);
			if (!hint) { return; }
			var span = document.createElement("span");
			span.className = "keyHint";
			span.textContent = hint === ";" ? ";" : hint === "'" ? "'" : hint.toUpperCase();
			node.appendChild(span);
		});
	}

	global.Piano = {
		init: function (opts) {
			opts = opts || {};
			listener = opts.onPress || null;
			bindPointer();
			decorateLabels();
		},
		press: press,
		cue: cue,
		clearCues: clearCues,
		resumeAudio: resumeAudio
	};
})(window);
