---
name: video-downloader
description: Download video and audio from URLs reliably using yt-dlp and ffmpeg. Covers format and quality selection, audio extraction, subtitles, playlists, batch jobs, archive tracking, rate limiting, and resumable downloads. Use when the user wants to download a video, rip audio, grab a playlist, fetch subtitles, or save a stream locally.
origin: ECC
---

# Video Downloader

Reliable, scriptable downloading of video and audio with `yt-dlp` and `ffmpeg`. This skill is about acquiring source media cleanly — not editing or generating it.

## When to Activate

- User wants to download a video or audio from a URL
- User wants to extract audio (MP3/M4A) from a video link
- User wants to grab a whole playlist or channel
- User wants subtitles, chapters, thumbnails, or metadata pulled alongside media
- User wants a resumable, rate-limited, or batch download job
- User says "download this video", "rip the audio", "save this playlist", "get subtitles"

## Authorized Use Only

Only download content the user has the right to download: their own uploads, content under a permissive license, or material that the platform's Terms of Service allow downloading. Respect copyright, robots/ToS, and rate limits. If a request looks like it circumvents paywalls, DRM, or platform restrictions, flag it and ask for clarification before proceeding. This skill assumes legitimate, authorized use.

## Tool Requirements

- `yt-dlp` — the downloader (actively maintained `youtube-dl` successor). Install: `pipx install yt-dlp` or `python -m pip install -U yt-dlp`
- `ffmpeg` — required for merging best video+audio streams, audio extraction, and remuxing
- Optional: `aria2c` for faster multi-connection downloads (`--downloader aria2c`)

Always prefer keeping `yt-dlp` up to date (`yt-dlp -U` or reinstall) — sites change and stale versions break.

## Core Concepts

### Format selection

`yt-dlp` separates video and audio streams. The default already picks best video+audio and merges with ffmpeg, but be explicit for predictable results:

```bash
# Best quality, merged into mp4
yt-dlp -f "bv*+ba/b" --merge-output-format mp4 "URL"

# Cap resolution at 1080p (avoid huge 4K files)
yt-dlp -f "bv*[height<=1080]+ba/b[height<=1080]" "URL"

# List all available formats first, then pick by ID
yt-dlp -F "URL"
yt-dlp -f 137+140 "URL"
```

Format string syntax: `bv*` = best video, `ba` = best audio, `+` = merge, `/` = fallback, `b` = best pre-merged.

### Output templates

Control filenames and directory layout with `-o`:

```bash
# Title-based filename in a target directory
yt-dlp -o "downloads/%(title)s.%(ext)s" "URL"

# Channel / playlist organized
yt-dlp -o "%(uploader)s/%(playlist_title)s/%(playlist_index)03d - %(title)s.%(ext)s" "URL"

# Restrict to filesystem-safe ASCII filenames
yt-dlp --restrict-filenames -o "%(title)s.%(ext)s" "URL"
```

### Audio extraction

```bash
# Extract best audio as MP3 at 192kbps
yt-dlp -x --audio-format mp3 --audio-quality 192K "URL"

# Keep original audio codec (no re-encode, fastest, best quality)
yt-dlp -f ba -x --audio-format m4a "URL"

# Embed thumbnail as cover art + metadata
yt-dlp -x --audio-format mp3 --embed-thumbnail --add-metadata "URL"
```

### Subtitles and metadata

```bash
# Download + embed subtitles (skip auto-generated noise unless asked)
yt-dlp --write-subs --sub-langs "en.*" --embed-subs "URL"

# Auto-generated captions when no manual subs exist
yt-dlp --write-auto-subs --sub-langs "en" --convert-subs srt "URL"

# Everything alongside the video
yt-dlp --write-info-json --write-thumbnail --embed-chapters --embed-metadata "URL"
```

### Playlists, channels, and ranges

```bash
# Whole playlist
yt-dlp -o "%(playlist_index)s - %(title)s.%(ext)s" "PLAYLIST_URL"

# Only items 5–10
yt-dlp --playlist-items 5-10 "PLAYLIST_URL"

# Single video even if URL has a playlist param
yt-dlp --no-playlist "URL"
```

### Batch and archive tracking

For repeatable jobs (e.g. a subscription mirror), use a URL list plus a download archive so already-fetched items are skipped:

```bash
# urls.txt has one URL per line
yt-dlp -a urls.txt --download-archive archive.txt

# Re-running only fetches new items
```

### Resilience: resume, retry, rate limit

```bash
yt-dlp \
  --continue \
  --retries 10 \
  --fragment-retries 10 \
  --limit-rate 2M \
  --sleep-requests 1 \
  --concurrent-fragments 4 \
  "URL"
```

- `--continue` resumes partial downloads
- `--limit-rate` and `--sleep-requests` avoid hammering the host (be a good citizen)
- `--concurrent-fragments` speeds up fragmented (HLS/DASH) downloads

### Authenticated / private content

Only for content the user is entitled to (e.g. their own account):

```bash
# Use browser cookies (no password handling)
yt-dlp --cookies-from-browser firefox "URL"

# Or an exported cookies.txt
yt-dlp --cookies cookies.txt "URL"
```

Never ask the user to paste raw passwords. Prefer `--cookies-from-browser`. Treat any cookies file as a secret — do not print or commit it.

### Live streams and HLS/DASH

```bash
# Record a live stream from now (Ctrl+C to stop)
yt-dlp --live-from-start "LIVE_URL"

# Direct .m3u8 / .mpd manifest
yt-dlp "https://host/stream.m3u8"
```

### Direct ffmpeg fallback

When the source is a plain manifest or progressive file and `yt-dlp` is unavailable:

```bash
# HLS to mp4
ffmpeg -i "https://host/stream.m3u8" -c copy output.mp4

# Trim while downloading a direct file
ffmpeg -ss 00:01:00 -i "https://host/video.mp4" -t 60 -c copy clip.mp4
```

## Recommended Workflow

1. Confirm the user is authorized to download the content; clarify if ambiguous.
2. Probe first: `yt-dlp -F "URL"` to see real available formats and whether auth is needed.
3. Pick an explicit format string for predictable quality/size.
4. Choose an output template and target directory (default to a `downloads/` dir, never the repo root).
5. Add resilience flags for anything large, batched, or flaky.
6. Verify the result (`ffprobe output.mp4` or check file size/duration) before reporting done.
7. Hand off to `video-editing` or `videodb` if the user wants to process the result.

## Anti-Patterns

- **Re-encoding when you can copy.** `--audio-format m4a` on native AAC, or remuxing instead of `-c copy`, wastes time and degrades quality. Default to stream copy.
- **No download archive on recurring jobs.** Re-downloading an entire channel every run wastes bandwidth and risks rate-limit bans. Use `--download-archive`.
- **Ignoring updates.** "It worked last month" — sites change extractors constantly. Update `yt-dlp` before debugging an extraction failure.
- **Dumping files in the working directory.** Always set an explicit `-o` template into a downloads folder so the repo stays clean.
- **Hammering the host.** No rate limit + high concurrency on a big playlist gets the user IP-throttled or blocked. Add `--limit-rate` / `--sleep-requests`.
- **Committing cookies or `*.info.json` with personal data.** These are secrets/PII. Keep them out of git.

## Best Practices

- Probe with `-F` before committing to a format.
- Prefer stream copy (`-c copy`, native `--audio-format`) over re-encoding.
- Use `--download-archive` for any job that will run more than once.
- Set explicit, sanitized output templates (`--restrict-filenames` for cross-platform safety).
- Add `--retries`, `--fragment-retries`, and `--continue` for large or unstable downloads.
- Keep `yt-dlp` current; treat extraction errors as "update first, then debug."
- Treat cookies/credentials as secrets — use `--cookies-from-browser`, never inline passwords.
- Always verify the output (duration, size, playability) before declaring success.

## Related Skills

- `video-editing` — cut, structure, and polish footage after download
- `videodb` — server-side ingest, indexing, search, and streaming of downloaded media
- `data-scraper-agent` — broader scraping workflows when downloads are part of data collection
- `content-engine` — when downloaded media feeds a distribution pipeline
