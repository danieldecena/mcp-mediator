import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONV_FILE = path.join(DATA_DIR, 'conversations.json');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CONV_FILE)) fs.writeFileSync(CONV_FILE, JSON.stringify({}), 'utf8');
}

export function appendMessage(convoId: string, msg: any) {
  ensure();
  const raw = fs.readFileSync(CONV_FILE, 'utf8');
  const db = JSON.parse(raw || '{}');
  if (!db[convoId]) db[convoId] = [];
  db[convoId].push(msg);
  fs.writeFileSync(CONV_FILE, JSON.stringify(db, null, 2), 'utf8');
}

export function getConversation(convoId: string) {
  ensure();
  const raw = fs.readFileSync(CONV_FILE, 'utf8');
  const db = JSON.parse(raw || '{}');
  return db[convoId] || [];
}
