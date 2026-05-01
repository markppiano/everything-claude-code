"""Convert piano key names to frequencies using equal temperament (A4 = 440 Hz)."""

import math
import re
import struct
import wave

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


def render_wav(notes, path, duration=0.5, sample_rate=44100, amplitude=0.5):
    """Render a list of notes as sine waves into a 16-bit mono WAV file.

    A short linear fade in/out is applied to each note to avoid click artifacts
    at sample boundaries.
    """
    samples_per_note = int(sample_rate * duration)
    fade = min(int(0.01 * sample_rate), samples_per_note // 2)
    max_int = 32767
    frames = bytearray()

    for note in notes:
        freq = note_to_frequency(note)
        for i in range(samples_per_note):
            envelope = 1.0
            if i < fade:
                envelope = i / fade
            elif i > samples_per_note - fade:
                envelope = (samples_per_note - i) / fade
            value = amplitude * envelope * math.sin(2 * math.pi * freq * i / sample_rate)
            frames += struct.pack("<h", int(value * max_int))

    with wave.open(path, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(bytes(frames))


if __name__ == "__main__":
    twinkle_opening = ["C4", "C4", "G4", "G4", "A4", "A4", "G4"]
    print("Twinkle Twinkle Little Star (opening):")
    analyze_sequence(twinkle_opening)
    render_wav(twinkle_opening, "twinkle.wav")
    print("\nWrote twinkle.wav")
