/**
 * Keyboard — turns physical key presses into piano presses.
 *
 * Holds a "down" set so an OS key-repeat doesn't machine-gun a note,
 * and stays quiet while the user is interacting with a form control.
 */
(function (global) {
	"use strict";

	var down = {};

	function isFormTarget(target) {
		if (!target) { return false; }
		var tag = target.tagName;
		return tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA";
	}

	function onKeyDown(ev) {
		if (ev.metaKey || ev.ctrlKey || ev.altKey) { return; }
		if (isFormTarget(ev.target)) { return; }
		var ch = ev.key;
		var keyId = global.KeyCode.forKey(ch);
		if (!keyId) { return; }
		ev.preventDefault();
		if (down[keyId]) { return; }
		down[keyId] = true;
		global.Piano.press(keyId, "key");
	}

	function onKeyUp(ev) {
		var keyId = global.KeyCode.forKey(ev.key);
		if (keyId) {
			delete down[keyId];
		}
	}

	function reset() {
		down = {};
	}

	global.Keyboard = {
		init: function () {
			global.addEventListener("keydown", onKeyDown);
			global.addEventListener("keyup", onKeyUp);
			global.addEventListener("blur", reset);
		},
		reset: reset
	};
})(window);
