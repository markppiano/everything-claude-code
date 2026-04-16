---
description: Schedule or send a text message from your Quo business phone to a contact.
---

# Schedule SMS (Quo)

Send or schedule a text message from your Quo business phone account to any contact.

## Usage

```
/schedule-sms
/schedule-sms <contact> "<message>"
/schedule-sms <contact> "<message>" at "<date/time>"
```

**Examples:**
- `/schedule-sms` — interactive mode, prompts for all details
- `/schedule-sms "John Smith" "Hey, are you free to chat?"` — send immediately
- `/schedule-sms +15551234567 "Reminder: meeting at 3pm" at "2024-06-15 14:30"` — scheduled

---

## How It Works

### Step 1 — Check prerequisites

Verify these environment variables exist before proceeding:

| Variable | Purpose |
|---|---|
| `QUO_API_KEY` | Quo API key (required) |
| `QUO_PHONE_NUMBER_ID` | Your sender phone number ID (required) |

If either is missing, guide the user through setup (see **Setup** section below) and stop.

### Step 2 — Collect missing details (interactive)

If the command was invoked without arguments, ask for:
1. **Recipient** — a contact name (looked up in Quo) or a phone number
2. **Message text** — what to send
3. **When** — "now" or a specific date/time

### Step 3 — Resolve the recipient

If the recipient is a name (not a phone number), search Quo contacts:

```bash
node scripts/quo-send.js --list-contacts --query "<name>"
```

Show the matches and confirm the right contact with the user before continuing.
If the recipient is a phone number, use it directly — no lookup needed.

### Step 4 — Send or schedule

**Send immediately:**
```bash
node scripts/quo-send.js --to "<phone or contact name>" --message "<text>"
```

**Schedule for a future time:**
```bash
node scripts/quo-send.js --to "<phone or contact name>" --message "<text>" --at "YYYY-MM-DD HH:MM"
```

The `--at` value can be any unambiguous date/time string, e.g.:
- `"2024-06-15 09:00"` — June 15 at 9 AM
- `"2024-06-15T14:30:00"` — ISO 8601

### Step 5 — Confirm outcome

Display a summary to the user:

```
✓ Message sent  (or: Scheduled for <date/time>)
  To:         <name> (<phone>)
  Message:    "<text>"
  Message ID: <id from Quo>
```

---

## Setup (first time)

Run these steps once to configure your Quo credentials:

**1. Get your API key**

In the Quo app: **Settings → Integrations → API → Generate API key**

```bash
export QUO_API_KEY="your-api-key-here"
```

**2. Find your phone number ID**

```bash
node scripts/quo-send.js --list-phone-numbers
```

This prints all numbers on your account with their IDs (e.g. `PNxxxxxxxxxx`).

```bash
export QUO_PHONE_NUMBER_ID="PNxxxxxxxxxx"
```

**3. Persist to shell profile**

Add both lines to `~/.zshrc` or `~/.bashrc` so they survive new sessions.

---

## Script Reference

`scripts/quo-send.js` — all options:

```
--list-phone-numbers               List all phone numbers on your account
--list-contacts [--query <name>]   Search your Quo contacts
--to "<name or phone>"             Recipient (contact name or E.164 number)
--message "<text>"                 Message body
--at "YYYY-MM-DD HH:MM"            Schedule for a future time (optional)
--phone-number-id <id>             Override the sender phone number ID
```
