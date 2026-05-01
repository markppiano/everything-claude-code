---
name: video-analysis
description: Watch and analyze a video file inside Claude Code. Extracts evenly-spaced frames with ffmpeg and (optionally) an audio transcript with whisper, then Claude reads the frames and transcript to answer questions about the video. Use when the user wants Claude to summarize, search, describe, or answer questions about a local video file — Gemini-style "watch this video" workflows.
origin: ECC
allowed-tools: Read Bash(node:*) Bash(ffmpeg:*) Bash(ffprobe:*) Bash(whisper:*)
argument-hint: "<video-path> [question]"
---

# Video Analysis

Give Claude eyes on a video file. Claude can't ingest video natively, but Claude *can* read images. The trick is the same one Gemini uses internally: sample frames, transcribe audio, analyze.

## When to Activate

- User wants Claude to "watch", "analyze", "summarize", or "describe" a video file
- User asks a question about a local video (`.mp4`, `.mov`, `.webm`, `.mkv`, etc.)
- User says things like "what happens in this video", "find the moment where X", "summarize this recording"
- Demo video review, lecture summarization, screen-recording walkthrough analysis

Don't activate for video *editing* (use `video-editing`), video *generation* (use `manim-video`, `remotion-video-creation`), or large-scale remote stream search (use `videodb`).

## How It Works

```
video file
  → ffprobe         (get duration)
  → ffmpeg          (extract N evenly-spaced frames as JPEG)
  → whisper         (optional: audio → transcript.txt)
  → manifest.json   (frame paths + timestamps + transcript path)
  → Claude reads manifest + frames with the Read tool
  → Claude answers the user's question
```

Why it works: a 5-minute video sampled at 16 frames is a tiny payload — 16 images Claude can actually look at, plus a transcript that covers what was said. Visual + audio coverage with one short script.

## Prerequisites

- `ffmpeg` and `ffprobe` on PATH (required)
- `whisper` (or compatible CLI) on PATH (optional, enables `--transcribe`)

Install ffmpeg:
- macOS: `brew install ffmpeg`
- Linux: `apt install ffmpeg` (or distro equivalent)
- Windows: `winget install Gyan.FFmpeg`

## Workflow

### 1. Run the extractor

```bash
node scripts/video-analysis/extract.js path/to/video.mp4 \
  --frames 16 \
  --transcribe \
  --question "What is being demonstrated?"
```

Outputs to `.video-analysis/<basename>/`:
- `manifest.json` — schema, video metadata, frame timestamps, transcript path
- `frame-01.jpg ... frame-NN.jpg` — JPEG samples
- `<basename>.txt` — transcript (if `--transcribe` succeeded)

The script prints a JSON summary on stdout with the manifest path.

### 2. Read what was extracted

Use the Read tool on `manifest.json` first to learn the structure, then on each frame image in order. If `transcriptPath` is set, Read it too.

### 3. Answer the user's question

Synthesize what you saw across frames with what was said in the transcript. Reference moments by timestamp — the manifest gives you `timestamp` per frame as `HH:MM:SS.mmm`.

## Tuning

| Situation | Recommended |
|-----------|-------------|
| Short clip (<1 min) | `--frames 8` |
| Standard video (1–10 min) | `--frames 16` (default) |
| Long lecture / recording | `--frames 32 --transcribe` (lean on transcript) |
| Action / sports / per-second changes | `--frames 64` |
| Audio-heavy podcast / talk | `--frames 4 --transcribe` (transcript carries it) |

Hard cap: 256 frames. Higher counts cost context for diminishing returns — sample more aggressively from a *region* you've already identified instead of carpet-bombing the whole video.

## Examples

### "Summarize this video"

```bash
node scripts/video-analysis/extract.js demo.mp4 --frames 16 --transcribe
```

Read `manifest.json`, then each frame, then the transcript. Produce a 3-bullet summary.

### "Find the moment where the error appears"

Extract densely, then narrow:

```bash
node scripts/video-analysis/extract.js bug.mov --frames 32
```

Scan frames, identify the index where the error appears, report its `timestamp` from the manifest. If you want a tighter bound, re-run on the surrounding 10s slice with `--frames 32` again.

### "What did the speaker say at 2:15?"

```bash
node scripts/video-analysis/extract.js talk.mp4 --frames 4 --transcribe
```

Read the transcript directly — visual analysis isn't needed unless the user asks for visual context.

## Slash Command

`/watch-video <video-path> [question]` runs this workflow end-to-end.

## Limits and Gotchas

- **Sampling is lossy.** A 16-frame sample of a 30-minute video misses sub-second events. Re-sample a narrower region if the user needs precise timing.
- **No native audio.** Transcription requires `whisper` (or a similar CLI). Without it, Claude is silent-film-only.
- **Files stay local during extraction.** Frames *are* sent to the model when you Read them, so don't run this on private content the user wouldn't share with Anthropic.
- **No DRM / encrypted streams.** ffmpeg won't decode protected video.
- **Extraction is sequential.** Large `--frames` values take longer; 16 frames on a 10-minute file is typically a few seconds.
