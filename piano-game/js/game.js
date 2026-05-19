/**
 * Game — the "Piano Rock Star" play-along challenge.
 *
 * A song is turned into a timeline of note events. Chips scroll right to
 * left toward the hit line while the matching piano key glows; the player
 * presses the key in time. Hits build a combo and score, misses break it.
 * "Listen" plays the chart for you (no scoring) so you can learn it.
 */
(function (global) {
	"use strict";

	var LEAD_MS = 2200;        // travel time from spawn to the hit line
	var HIT_WINDOW = 220;      // +/- ms counted as a hit
	var PERFECT_WINDOW = 110;  // +/- ms counted as perfect
	var CUE_WINDOW = 700;      // glow the target key this far ahead
	var TAIL_MS = 900;         // grace period after the last note

	var dom = {};
	var state = null;
	var rafId = 0;

	function $(id) { return document.getElementById(id); }

	function buildTimeline(song, difficulty) {
		var beatMs = (60000 / song.bpm) * difficulty;
		var events = [];
		var offset = 0;
		song.notes.forEach(function (note, i) {
			var key = global.MusicKey.byNote(note.note);
			if (key) {
				events.push({
					index: i,
					keyId: key.id,
					note: note.note,
					offset: offset,
					judged: false,
					played: false,
					result: null,
					chip: null,
					spawned: false
				});
			}
			offset += note.beats * beatMs;
		});
		return { events: events, totalMs: offset };
	}

	function makeChip(ev) {
		var key = global.MusicKey.byId(ev.keyId);
		var chip = document.createElement("div");
		chip.className = "chip" + (key.sharp ? " chip-sharp" : "");
		var letter = ev.note.replace(/[0-9]/g, "");
		var hint = global.KeyCode.labelFor(ev.keyId);
		chip.innerHTML =
			'<span class="chip-note">' + letter + "</span>" +
			'<span class="chip-key">' + (hint ? hint.toUpperCase() : "") + "</span>";
		dom.lane.appendChild(chip);
		ev.chip = chip;
	}

	function setHud() {
		dom.score.textContent = String(Math.round(state.score));
		dom.combo.textContent = String(state.combo);
		var judged = state.hits + state.misses;
		var acc = judged === 0 ? 100 : Math.round((state.hits / judged) * 100);
		dom.accuracy.textContent = acc + "%";
	}

	function flashJudge(text, kind) {
		dom.judge.textContent = text;
		dom.judge.className = "judge show " + kind;
		clearTimeout(state.judgeTimer);
		state.judgeTimer = setTimeout(function () {
			dom.judge.className = "judge";
		}, 520);
	}

	function judge(ev, delta) {
		ev.judged = true;
		var perfect = Math.abs(delta) <= PERFECT_WINDOW;
		ev.result = perfect ? "perfect" : "good";
		state.hits += 1;
		state.combo += 1;
		state.bestCombo = Math.max(state.bestCombo, state.combo);
		var base = perfect ? 120 : 60;
		state.score += base * (1 + state.combo * 0.03);
		if (ev.chip) {
			ev.chip.classList.add(perfect ? "chip-perfect" : "chip-good");
		}
		flashJudge(perfect ? "PERFECT" : "GOOD", perfect ? "perfect" : "good");
		setHud();
	}

	function missEvent(ev) {
		ev.judged = true;
		ev.result = "miss";
		state.misses += 1;
		state.combo = 0;
		if (ev.chip) {
			ev.chip.classList.add("chip-miss");
		}
		flashJudge("MISS", "miss");
		setHud();
	}

	function handleUserPress(keyId) {
		if (!state || state.mode !== "play" || state.finished) { return; }
		var now = performance.now();
		var best = null;
		var bestAbs = Infinity;
		for (var i = 0; i < state.timeline.events.length; i++) {
			var ev = state.timeline.events[i];
			if (ev.judged || ev.keyId !== keyId) { continue; }
			var delta = now - (state.startAt + ev.offset);
			if (Math.abs(delta) <= HIT_WINDOW && Math.abs(delta) < bestAbs) {
				best = { ev: ev, delta: delta };
				bestAbs = Math.abs(delta);
			}
		}
		if (best) {
			judge(best.ev, best.delta);
		}
	}

	function tick() {
		var now = performance.now();
		var laneW = dom.lane.clientWidth;
		var hitX = state.hitX;
		var pxPerMs = (laneW - hitX) / LEAD_MS;
		var events = state.timeline.events;
		var pending = 0;

		for (var i = 0; i < events.length; i++) {
			var ev = events[i];
			var hitTime = state.startAt + ev.offset;
			var remaining = hitTime - now;

			if (remaining <= LEAD_MS && !ev.spawned) {
				ev.spawned = true;
				makeChip(ev);
			}
			if (ev.chip) {
				var x = hitX + remaining * pxPerMs;
				ev.chip.style.transform = "translateX(" + x + "px)";
				if (x < -90) {
					ev.chip.remove();
					ev.chip = null;
				}
			}

			if (state.mode === "listen") {
				if (!ev.played && remaining <= 0) {
					ev.played = true;
					global.Piano.press(ev.keyId, "auto");
				}
			} else if (!ev.judged && remaining < -HIT_WINDOW) {
				missEvent(ev);
			}

			var cueOn = ev.result === null && !ev.played &&
				remaining <= CUE_WINDOW && remaining > -HIT_WINDOW;
			global.Piano.cue(ev.keyId, cueOn);

			if (state.mode === "listen" ? !ev.played : !ev.judged) {
				pending += 1;
			}
		}

		var ended = pending === 0 &&
			now > state.startAt + state.timeline.totalMs + TAIL_MS;
		if (ended) {
			finish();
			return;
		}
		rafId = global.requestAnimationFrame(tick);
	}

	function setRunning(running) {
		dom.startBtn.disabled = running;
		dom.listenBtn.disabled = running;
		dom.stopBtn.disabled = !running;
		dom.songSelect.disabled = running;
		dom.tempoSelect.disabled = running;
	}

	function teardown() {
		if (rafId) {
			global.cancelAnimationFrame(rafId);
			rafId = 0;
		}
		global.Piano.clearCues();
		dom.lane.innerHTML = "";
		dom.judge.className = "judge";
		setRunning(false);
	}

	function start(mode) {
		stop(true);
		var song = global.Song.byId(dom.songSelect.value);
		if (!song) { return; }
		var difficulty = parseFloat(dom.tempoSelect.value) || 1;
		global.Piano.resumeAudio();
		global.Keyboard.reset();

		state = {
			mode: mode,
			song: song,
			timeline: buildTimeline(song, difficulty),
			startAt: performance.now() + LEAD_MS,
			hitX: 64,
			score: 0,
			combo: 0,
			bestCombo: 0,
			hits: 0,
			misses: 0,
			finished: false,
			judgeTimer: 0
		};
		setHud();
		setRunning(true);
		flashJudge(mode === "listen" ? "LISTEN" : "GET READY", "ready");
		rafId = global.requestAnimationFrame(tick);
	}

	function finish() {
		if (!state || state.finished) { return; }
		state.finished = true;
		var judged = state.hits + state.misses;
		teardown();

		if (state.mode === "listen" || judged === 0) {
			return;
		}

		var acc = Math.round((state.hits / judged) * 100);
		var rank = acc >= 95 ? "ROCK STAR"
			: acc >= 80 ? "ENCORE!"
				: acc >= 55 ? "NICE SET"
					: "KEEP PRACTICING";
		dom.resultsRank.textContent = rank;
		dom.resultsScore.textContent = String(Math.round(state.score));
		dom.resultsAccuracy.textContent = acc + "%";
		dom.resultsCombo.textContent = String(state.bestCombo);
		dom.results.classList.remove("hidden");
	}

	function stop(silent) {
		if (!state) {
			teardown();
			return;
		}
		state.finished = true;
		teardown();
		if (!silent) {
			dom.judge.className = "judge";
		}
	}

	function populateSongs() {
		global.Song.ALL.forEach(function (s) {
			var opt = document.createElement("option");
			opt.value = s.id;
			opt.textContent = s.title;
			dom.songSelect.appendChild(opt);
		});
	}

	function init() {
		dom = {
			score: $("score"),
			combo: $("combo"),
			accuracy: $("accuracy"),
			songSelect: $("songSelect"),
			tempoSelect: $("tempoSelect"),
			startBtn: $("startBtn"),
			stopBtn: $("stopBtn"),
			listenBtn: $("listenBtn"),
			lane: $("lane"),
			judge: $("judge"),
			results: $("results"),
			resultsRank: $("resultsRank"),
			resultsScore: $("resultsScore"),
			resultsAccuracy: $("resultsAccuracy"),
			resultsCombo: $("resultsCombo"),
			resultsClose: $("resultsClose")
		};

		populateSongs();
		global.Piano.init({ onPress: handleUserPress });
		global.Keyboard.init();

		dom.startBtn.addEventListener("click", function () { start("play"); });
		dom.listenBtn.addEventListener("click", function () { start("listen"); });
		dom.stopBtn.addEventListener("click", function () { stop(false); });
		dom.resultsClose.addEventListener("click", function () {
			dom.results.classList.add("hidden");
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}

	global.Game = { start: start, stop: stop };
})(window);
