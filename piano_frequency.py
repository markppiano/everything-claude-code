"""Convert piano key names to frequencies using equal temperament (A4 = 440 Hz)."""

import re

NOTE_SEMITONES = {
    "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "Fb": 4, "E#": 5,
    "F": 5, "F#": 6, "Gb": 6,
    "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10,
    "B": 11, "Cb": 11, "B#": 12,
}

NOTE_RE = re.compile(r"^([A-Ga-g])([#b]?)(-?\d+)$")


def note_to_frequency(note: str) -> float:
    """Return the frequency in Hz for a note like 'C4' or 'F#5'."""
    match = NOTE_RE.match(note.strip())
    if not match:
        raise ValueError(f"Invalid note: {note!r}")

    letter, accidental, octave = match.groups()
    pitch = letter.upper() + accidental
    semitone = NOTE_SEMITONES[pitch]

    # MIDI note number: C-1 = 0, so C4 = 60, A4 = 69
    midi = (int(octave) + 1) * 12 + semitone
    return 440.0 * (2 ** ((midi - 69) / 12))


def analyze_sequence(notes):
    """Print each note's frequency and the ratio between consecutive notes."""
    prev_freq = None
    for note in notes:
        freq = note_to_frequency(note)
        if prev_freq is None:
            print(f"{note:<4}  {freq:8.3f} Hz")
        else:
            ratio = freq / prev_freq
            print(f"{note:<4}  {freq:8.3f} Hz   ratio from previous: {ratio:.4f}")
        prev_freq = freq


if __name__ == "__main__":
    twinkle_opening = ["C4", "C4", "G4", "G4", "A4", "A4", "G4"]
    print("Twinkle Twinkle Little Star (opening):")
    analyze_sequence(twinkle_opening)
