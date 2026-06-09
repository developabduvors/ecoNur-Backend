const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { name, phone, service } = req.body;

  if (!name && !phone) {
    return res.status(400).json({ success: false, message: 'Ism yoki telefon kerak' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

  console.log('--- Yangi ariza ---');
  console.log('Ism:', name);
  console.log('Telefon:', phone);
  console.log('Xizmat:', service || '—');

  const text = [
    '🛎 *Zakaz keldi — Eco Nur*',
    '',
    `👤 Ism: ${name || '—'}`,
    `📞 Telefon: ${phone || '—'}`,
    `🧹 Xizmat: ${service || '—'}`,
    `🕐 Vaqt: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`,
  ].join('\n');

  try {
    if (BOT_TOKEN && CHAT_ID) {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' }),
      });
      const result = await response.json();
      if (!response.ok) {
        console.error('Telegram xato:', JSON.stringify(result));
      } else {
        console.log('Telegram: xabar yuborildi ✓');
      }
    } else {
      console.warn('TELEGRAM sozlanmagan — .env faylini tekshiring');
    }
    res.json({ success: true, message: 'Ariza qabul qilindi' });
  } catch (err) {
    console.error('Xato:', err.message);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

module.exports = router;
