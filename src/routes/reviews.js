const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();
const FILE = path.join(__dirname, '..', 'data', 'reviews.json');

// ── Faylga o'qish/yozish (kichik hajm uchun sync yetarli) ──
function readAll() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}
function writeAll(list) {
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), 'utf8');
}

// ── GET /api/reviews — faqat tasdiqlangan sharhlar, yangidan eskiga ──
router.get('/', (req, res) => {
  const list = readAll()
    .filter((r) => r.approved)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json({ success: true, data: list });
});

// ── POST /api/reviews — yangi sharh (tasdiqlanmagan holatda) ──
router.post('/', async (req, res) => {
  const { author, rating, text, service } = req.body || {};
  const r = Number(rating);

  if (!author || !String(author).trim()) {
    return res.status(400).json({ success: false, message: 'Ism kerak' });
  }
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return res.status(400).json({ success: false, message: 'Baho 1–5 oralig\'ida bo\'lishi kerak' });
  }
  if (!text || String(text).trim().length < 5) {
    return res.status(400).json({ success: false, message: 'Izoh juda qisqa' });
  }

  const review = {
    id: crypto.randomUUID(),
    author: String(author).trim().slice(0, 60),
    date: new Date().toISOString().slice(0, 10),
    rating: r,
    text: String(text).trim().slice(0, 500),
    service: String(service || '').trim().slice(0, 60) || 'Umumiy',
    approved: false, // egasi tasdiqlamaguncha ko'rinmaydi
  };

  const list = readAll();
  list.push(review);
  writeAll(list);

  // Telegramga xabar + tasdiqlash havolasi
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  const PUBLIC_URL = (process.env.PUBLIC_API_URL || '').replace(/\/$/, '');

  try {
    if (BOT_TOKEN && CHAT_ID) {
      const approveLink =
        ADMIN_TOKEN && PUBLIC_URL
          ? `\n\n✅ Tasdiqlash: ${PUBLIC_URL}/api/reviews/${review.id}/approve?token=${ADMIN_TOKEN}`
          : '\n\n(Tasdiqlash uchun ADMIN_TOKEN va PUBLIC_API_URL sozlang)';
      const msg = [
        '⭐ *Yangi sharh — Eco Nur*',
        '',
        `👤 ${review.author}`,
        `🧹 ${review.service}`,
        `⭐ Baho: ${review.rating}/5`,
        `💬 ${review.text}`,
        approveLink,
      ].join('\n');
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' }),
      });
    }
  } catch (err) {
    console.error('Telegram xato:', err.message);
  }

  res.json({ success: true, message: 'Sharhingiz tekshiruvdan keyin chiqadi. Rahmat!' });
});

// ── GET /api/reviews/:id/approve?token=... — egasi tasdiqlaydi ──
router.get('/:id/approve', (req, res) => {
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  if (!ADMIN_TOKEN || req.query.token !== ADMIN_TOKEN) {
    return res.status(403).json({ success: false, message: 'Ruxsat yo\'q' });
  }
  const list = readAll();
  const item = list.find((r) => r.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Topilmadi' });
  item.approved = true;
  writeAll(list);
  res.json({ success: true, message: 'Sharh tasdiqlandi ✓' });
});

module.exports = router;
