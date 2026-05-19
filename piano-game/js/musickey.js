/**
 * MusicKey — note/frequency math and the keyboard's physical key map.
 *
 * Frequencies use equal temperament with A4 = 440 Hz, matching the
 * project's piano_frequency.py and twinkle.html.
 */
(function (global) {
	"use strict";

	var NOTE_SEMITONES = {
		C: 0, "C#": 1, Db: 1,
		D: 2, "D#": 3, Eb: 3,
		E: 4, Fb: 4, "E#": 5,
		F: 5, "F#": 6, Gb: 6,
		G: 7, "G#": 8, Ab: 8,
		A: 9, "A#": 10, Bb: 10,
		B: 11, Cb: 11, "B#": 12
	};

	var NOTE_RE = /^([A-Ga-g])([#b]?)(-?\d+)$/;

	function noteToFrequency(note) {
		var m = NOTE_RE.exec(String(note).trim());
		if (!m) {
			throw new Error("Invalid note: " + note);
		}
		var pitch = m[1].toUpperCase() + m[2];
		var semitone = NOTE_SEMITONES[pitch];
		var midi = (parseInt(m[3], 10) + 1) * 12 + semitone;
		return 440 * Math.pow(2, (midi - 69) / 12);
	}

	// Physical keys, left to right, exactly matching the DOM ids in index.html.
	var KEYS = [
		{ id: "keyC", note: "C4", sharp: false },
		{ id: "sharpC", note: "C#4", sharp: true },
		{ id: "keyD", note: "D4", sharp: false },
		{ id: "sharpD", note: "D#4", sharp: true },
		{ id: "keyE", note: "E4", sharp: false },
		{ id: "keyF", note: "F4", sharp: false },
		{ id: "sharpF", note: "F#4", sharp: true },
		{ id: "keyG", note: "G4", sharp: false },
		{ id: "sharpG", note: "G#4", sharp: true },
		{ id: "keyA", note: "A4", sharp: false },
		{ id: "sharpA", note: "A#4", sharp: true },
		{ id: "keyB", note: "B4", sharp: false },
		{ id: "keyC1", note: "C5", sharp: false },
		{ id: "sharpC1", note: "C#5", sharp: true },
		{ id: "keyD1", note: "D5", sharp: false },
		{ id: "sharpD1", note: "D#5", sharp: true },
		{ id: "keyE1", note: "E5", sharp: false },
		{ id: "keyF1", note: "F5", sharp: false }
	];

	var byId = {};
	var byNote = {};
	KEYS.forEach(function (k) {
		k.frequency = noteToFrequency(k.note);
		byId[k.id] = k;
		byNote[k.note] = k;
	});

	global.MusicKey = {
		KEYS: KEYS,
		noteToFrequency: noteToFrequency,
		byId: function (id) { return byId[id] || null; },
		byNote: function (note) { return byNote[note] || null; }
	};
})(window);
