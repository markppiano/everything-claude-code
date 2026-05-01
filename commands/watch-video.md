---
description: Watch a local video file — extracts frames + optional transcript with ffmpeg/whisper, then analyzes
argument-hint: <video-path> [question]
---

# Watch Video

**Input**: $ARGUMENTS

Activate the `video-analysis` skill and run the workflow end-to-end.

## Phase 1 — PARSE

Split `$ARGUMENTS`:
- First positional token = video path (resolve to absolute if relative)
- Remaining tokens = the user's question (may be empty → default to "Summarize this video")

If no path provided, stop and ask the user for one.

## Phase 2 — EXTRACT

```bash
node scripts/video-analysis/extract.js "<video-path>" \
  --frames 16 \
  --transcribe \
  --question "<question>"
```

Failure modes:
- `ffmpeg` / `ffprobe` not found → tell the user to install ffmpeg, stop.
- Video file missing → report the resolved path, stop.
- Other errors → surface stderr and stop.

The script prints a JSON summary on stdout with `manifest`, `framesDir`, `frameCount`, `durationSec`, `transcriptPath`. Capture the `manifest` path.

## Phase 3 — READ

1. Read `manifest.json` to learn the frame layout.
2. Read each `frames[i].path` in order using the Read tool.
3. If `transcriptPath` is non-null, Read it.

## Phase 4 — ANSWER

Answer the user's question (or summarize, if none) using both visual and audio evidence. Reference moments by `timestamp` from the manifest. Be concrete: distinguish what you *saw* in frames from what was *said* in the transcript.

If the video is long (>10 min) or no transcript was produced, suggest the user re-run with higher `--frames` or install `whisper`.
