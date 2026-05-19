/**
 * Song — note charts for the play-along game.
 *
 * Each note is [noteName, beats]. The game turns beats into milliseconds
 * using the song's bpm and the selected difficulty multiplier. Every note
 * here stays within the C4-F5 range that the on-screen keyboard covers.
 */
(function (global) {
	"use strict";

	function n(name, beats) {
		return { note: name, beats: beats || 1 };
	}

	var SONGS = [
		{
			id: "twinkle",
			title: "Twinkle, Twinkle, Little Star",
			bpm: 120,
			notes: [
				n("C4"), n("C4"), n("G4"), n("G4"), n("A4"), n("A4"), n("G4", 2),
				n("F4"), n("F4"), n("E4"), n("E4"), n("D4"), n("D4"), n("C4", 2),
				n("G4"), n("G4"), n("F4"), n("F4"), n("E4"), n("E4"), n("D4", 2),
				n("G4"), n("G4"), n("F4"), n("F4"), n("E4"), n("E4"), n("D4", 2),
				n("C4"), n("C4"), n("G4"), n("G4"), n("A4"), n("A4"), n("G4", 2),
				n("F4"), n("F4"), n("E4"), n("E4"), n("D4"), n("D4"), n("C4", 2)
			]
		},
		{
			id: "mary",
			title: "Mary Had a Little Lamb",
			bpm: 110,
			notes: [
				n("E4"), n("D4"), n("C4"), n("D4"), n("E4"), n("E4"), n("E4", 2),
				n("D4"), n("D4"), n("D4", 2), n("E4"), n("G4"), n("G4", 2),
				n("E4"), n("D4"), n("C4"), n("D4"), n("E4"), n("E4"), n("E4"),
				n("E4"), n("D4"), n("D4"), n("E4"), n("D4"), n("C4", 4)
			]
		},
		{
			id: "ode",
			title: "Ode to Joy",
			bpm: 114,
			notes: [
				n("E4"), n("E4"), n("F4"), n("G4"), n("G4"), n("F4"), n("E4"), n("D4"),
				n("C4"), n("C4"), n("D4"), n("E4"), n("E4", 1.5), n("D4", 0.5), n("D4", 2),
				n("E4"), n("E4"), n("F4"), n("G4"), n("G4"), n("F4"), n("E4"), n("D4"),
				n("C4"), n("C4"), n("D4"), n("E4"), n("D4", 1.5), n("C4", 0.5), n("C4", 2)
			]
		},
		{
			id: "jingle",
			title: "Jingle Bells",
			bpm: 130,
			notes: [
				n("E4"), n("E4"), n("E4", 2), n("E4"), n("E4"), n("E4", 2),
				n("E4"), n("G4"), n("C4"), n("D4"), n("E4", 4),
				n("F4"), n("F4"), n("F4"), n("F4"), n("F4"), n("E4"), n("E4"), n("E4"),
				n("E4"), n("D4"), n("D4"), n("E4"), n("D4", 2), n("G4", 2)
			]
		},
		{
			id: "scale",
			title: "C Major Scale (warm-up)",
			bpm: 100,
			notes: [
				n("C4"), n("D4"), n("E4"), n("F4"), n("G4"), n("A4"), n("B4"), n("C5", 2),
				n("C5"), n("B4"), n("A4"), n("G4"), n("F4"), n("E4"), n("D4"), n("C4", 2)
			]
		}
	];

	var byId = {};
	SONGS.forEach(function (s) { byId[s.id] = s; });

	global.Song = {
		ALL: SONGS,
		byId: function (id) { return byId[id] || null; }
	};
})(window);
