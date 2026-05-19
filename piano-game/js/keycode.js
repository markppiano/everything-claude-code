/**
 * KeyCode — maps a computer-keyboard key to a piano key id.
 *
 * Layout mirrors a real keyboard: white keys on the home row,
 * black keys on the row above, like a DAW piano-roll input.
 *
 *    w e   t y u   o p
 *   a s d f g h j k l ; '
 */
(function (global) {
	"use strict";

	var MAP = {
		a: "keyC",
		w: "sharpC",
		s: "keyD",
		e: "sharpD",
		d: "keyE",
		f: "keyF",
		t: "sharpF",
		g: "keyG",
		y: "sharpG",
		h: "keyA",
		u: "sharpA",
		j: "keyB",
		k: "keyC1",
		o: "sharpC1",
		l: "keyD1",
		p: "sharpD1",
		";": "keyE1",
		"'": "keyF1"
	};

	// Reverse lookup: piano key id -> the keyboard char that triggers it.
	var LABEL = {};
	Object.keys(MAP).forEach(function (ch) {
		LABEL[MAP[ch]] = ch;
	});

	global.KeyCode = {
		forKey: function (ch) {
			return MAP[String(ch).toLowerCase()] || null;
		},
		labelFor: function (keyId) {
			return LABEL[keyId] || "";
		}
	};
})(window);
