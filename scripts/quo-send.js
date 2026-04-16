#!/usr/bin/env node
'use strict';
/**
 * Quo SMS sender
 * Sends or schedules text messages via the Quo (formerly OpenPhone) API.
 *
 * Required env vars:
 *   QUO_API_KEY          - Quo API key (Settings → Integrations → API)
 *   QUO_PHONE_NUMBER_ID  - Default sender phone number ID (e.g. PNxxxxxxxx)
 *
 * Usage:
 *   node scripts/quo-send.js --list-phone-numbers
 *   node scripts/quo-send.js --list-contacts [--query "name"]
 *   node scripts/quo-send.js --to "<name or +1phone>" --message "<text>"
 *   node scripts/quo-send.js --to "<name or +1phone>" --message "<text>" --at "YYYY-MM-DD HH:MM"
 */

const https = require('https');

const API_HOST = 'api.openphone.com';
const API_BASE = '/v1';

// ── Auth ──────────────────────────────────────────────────────────────────────

function requireApiKey() {
  const key = process.env.QUO_API_KEY;
  if (!key) {
    console.error('Error: QUO_API_KEY environment variable is not set.');
    console.error('  1. Open the Quo app → Settings → Integrations → API');
    console.error('  2. Generate an API key and copy it');
    console.error('  3. export QUO_API_KEY="your-key-here"');
    process.exit(1);
  }
  return key;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

function apiRequest(method, path, body) {
  const apiKey = requireApiKey();
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: API_HOST,
      path: API_BASE + path,
      method,
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          const msg = parsed.message || parsed.error || JSON.stringify(parsed);
          reject(new Error(`Quo API ${res.statusCode}: ${msg}`));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Phone number listing ──────────────────────────────────────────────────────

async function listPhoneNumbers() {
  const result = await apiRequest('GET', '/phone-numbers');
  const numbers = result.data || [];
  if (numbers.length === 0) {
    console.log('No phone numbers found in your Quo account.');
    return;
  }
  console.log('Phone numbers in your Quo account:\n');
  for (const n of numbers) {
    const display = n.phoneNumber || n.number || '(unknown)';
    console.log(`  ID:     ${n.id}`);
    console.log(`  Number: ${display}`);
    if (n.name) console.log(`  Name:   ${n.name}`);
    console.log('');
  }
  console.log('Tip: export QUO_PHONE_NUMBER_ID="<ID from above>"');
}

// ── Contact search ────────────────────────────────────────────────────────────

async function listContacts(query) {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  const result = await apiRequest('GET', `/contacts${qs}`);
  const contacts = result.data || [];
  if (contacts.length === 0) {
    console.log(query ? `No contacts found matching "${query}".` : 'No contacts found.');
    return contacts;
  }
  console.log(`Found ${contacts.length} contact(s):\n`);
  for (const c of contacts) {
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || '(no name)';
    const phones = (c.phoneNumbers || []).map(p => p.phoneNumber).join(', ') || '(no phone)';
    console.log(`  Name:  ${name}`);
    console.log(`  Phone: ${phones}`);
    console.log('');
  }
  return contacts;
}

/**
 * Resolve a recipient string (name or phone number) to an E.164 phone number.
 * If the input looks like a phone number it is normalised directly.
 * Otherwise the Quo contacts API is searched by name.
 */
async function resolveRecipient(nameOrPhone) {
  const stripped = nameOrPhone.replace(/\D/g, '');

  // Looks like a phone number — normalise to E.164
  if (/^[+\d]/.test(nameOrPhone) && stripped.length >= 7) {
    if (stripped.length === 10) return `+1${stripped}`;
    if (stripped.length === 11 && stripped.startsWith('1')) return `+${stripped}`;
    return nameOrPhone.startsWith('+') ? nameOrPhone : `+${stripped}`;
  }

  // Search by name
  const result = await apiRequest('GET', `/contacts?q=${encodeURIComponent(nameOrPhone)}`);
  const contacts = result.data || [];
  if (contacts.length === 0) {
    throw new Error(`No Quo contact found matching "${nameOrPhone}"`);
  }

  const contact = contacts[0];
  const phones = contact.phoneNumbers || [];
  if (phones.length === 0) {
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    throw new Error(`Contact "${name}" has no phone number in Quo`);
  }

  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  console.log(`Resolved contact: ${name} → ${phones[0].phoneNumber}`);
  return phones[0].phoneNumber;
}

// ── Message send ──────────────────────────────────────────────────────────────

async function sendMessage({ to, message, phoneNumberId, scheduledAt }) {
  const body = {
    content: message,
    from: phoneNumberId,
    to: [to],
  };

  // Include scheduledAt if provided — supported by Quo API when available
  if (scheduledAt) {
    body.scheduledAt = scheduledAt;
  }

  return apiRequest('POST', '/messages', body);
}

// ── Arg parser ────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--list-phone-numbers': args.listPhoneNumbers = true; break;
      case '--list-contacts':     args.listContacts = true; break;
      case '--to':                args.to = argv[++i]; break;
      case '--message':           args.message = argv[++i]; break;
      case '--at':                args.at = argv[++i]; break;
      case '--phone-number-id':   args.phoneNumberId = argv[++i]; break;
      case '--query':             args.query = argv[++i]; break;
    }
  }
  return args;
}

function parseScheduledAt(atStr) {
  const d = new Date(atStr);
  if (isNaN(d.getTime())) {
    throw new Error(
      `Cannot parse date/time: "${atStr}"\n` +
      '  Use ISO 8601 or "YYYY-MM-DD HH:MM" format, e.g. "2024-06-15 14:30"'
    );
  }
  if (d <= new Date()) {
    throw new Error(`Scheduled time "${atStr}" is in the past`);
  }
  return d.toISOString();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.listPhoneNumbers) {
    await listPhoneNumbers();
    return;
  }

  if (args.listContacts) {
    await listContacts(args.query);
    return;
  }

  if (!args.to || !args.message) {
    console.log('Quo SMS Sender\n');
    console.log('Commands:');
    console.log('  --list-phone-numbers               List phone numbers in your account');
    console.log('  --list-contacts [--query <name>]   Search contacts');
    console.log('');
    console.log('Send a message:');
    console.log('  --to "<name or phone>"  Recipient (contact name or +1XXXXXXXXXX)');
    console.log('  --message "<text>"      Message content');
    console.log('  --at "YYYY-MM-DD HH:MM" Schedule for a future time (optional)');
    console.log('  --phone-number-id <id>  Override sender phone number ID');
    console.log('');
    console.log('Environment variables:');
    console.log('  QUO_API_KEY          Your Quo API key (required)');
    console.log('  QUO_PHONE_NUMBER_ID  Default sender phone number ID');
    process.exit(1);
  }

  const phoneNumberId = args.phoneNumberId || process.env.QUO_PHONE_NUMBER_ID;
  if (!phoneNumberId) {
    console.error('Error: sender phone number ID is required.');
    console.error('  Run --list-phone-numbers to find your ID, then:');
    console.error('  export QUO_PHONE_NUMBER_ID="PNxxxxxxxxxx"');
    process.exit(1);
  }

  // Resolve recipient to phone number
  const toPhone = await resolveRecipient(args.to);

  // Parse optional schedule time
  let scheduledAt = null;
  if (args.at) {
    scheduledAt = parseScheduledAt(args.at);
  }

  // Send or schedule
  const result = await sendMessage({
    to: toPhone,
    message: args.message,
    phoneNumberId,
    scheduledAt,
  });

  if (scheduledAt) {
    console.log(`✓ Message scheduled for ${new Date(scheduledAt).toLocaleString()}`);
  } else {
    console.log('✓ Message sent successfully');
  }

  const msg = result.data;
  if (msg && msg.id) {
    console.log(`  Message ID: ${msg.id}`);
  }
}

main().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
