import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

// GET — fetch notifications
export async function GET(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const db = getDb();

  // Auto-generate monthly reminders if none exist for this month
  generateMonthlyReminders(db, payload.id);

  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30').all(payload.id);
  return NextResponse.json({ notifications });
}

// POST — mark as read or create custom notification
export async function POST(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const db = getDb();
  const { id, markRead, markAllRead, title, message, type } = await request.json();
  if (markAllRead) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(payload.id);
    return NextResponse.json({ success: true });
  }
  if (id && markRead) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, payload.id);
    return NextResponse.json({ success: true });
  }
  if (title && message) {
    db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)').run(payload.id, type || 'info', title, message);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

function generateMonthlyReminders(db, userId) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Check if we already generated reminders for this month
  const existing = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND title LIKE ? AND created_at LIKE ?").get(userId, '%Monthly%', `${monthKey}%`);
  if (existing.count > 0) return;

  // Get user profile for personalized reminders
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  const user = db.prepare('SELECT name, mode, email FROM users WHERE id = ?').get(userId);
  if (!profile) return;

  const income = profile.income || 0;
  const expenses = profile.expenses || 0;
  const emi = profile.emi || 0;
  const savings = income - expenses - emi;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  const mf = profile.mutual_funds || 0;
  const stocks = profile.stocks || 0;
  const fd = profile.fd_ppf || 0;
  const gold = profile.gold || 0;
  const nw = mf + stocks + fd + gold;
  const inv80c = profile.investments_80c || 0;

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthName = monthNames[now.getMonth()];

  // Generate personalized monthly reminders
  const reminders = [
    {
      type: 'reminder',
      title: `📅 Monthly Financial Check-in — ${monthName}`,
      message: `Hi ${user.name}! Time for your ${monthName} money review. Your savings rate is ${savingsRate}% (₹${savings.toLocaleString('en-IN')}/month). ${savingsRate >= 30 ? 'Amazing work! 🎉' : savingsRate >= 20 ? 'Good, but aim for 30%! 💪' : 'Let\'s try to push this higher! 🎯'}`
    },
    {
      type: 'reminder',
      title: '💰 SIP Investment Reminder',
      message: `Have you invested your SIP for ${monthName}? If you invest ₹${Math.round(savings * 0.4).toLocaleString('en-IN')}/month, you could build ₹${Math.round((savings * 0.4 * 12 * 15 * 1.4) / 100000).toLocaleString('en-IN')}L in 15 years at 12% CAGR. Start or increase your SIP today!`
    }
  ];

  // Tax season reminder (Jan-Mar)
  if (now.getMonth() >= 0 && now.getMonth() <= 2) {
    reminders.push({
      type: 'alert',
      title: '🚨 Tax Season Alert!',
      message: `Only ${3 - now.getMonth()} month(s) left to save tax this FY! Your 80C used: ₹${inv80c.toLocaleString('en-IN')} / ₹1,50,000. ${inv80c >= 150000 ? 'Maxed out! ✅' : `Gap: ₹${(150000 - inv80c).toLocaleString('en-IN')} — invest in ELSS or PPF now!`}`
    });
  }

  // Net worth milestone
  if (nw > 0) {
    reminders.push({
      type: 'info',
      title: `📊 Net Worth Update — ${monthName}`,
      message: `Your current net worth is ₹${nw >= 100000 ? (nw / 100000).toFixed(1) + 'L' : nw.toLocaleString('en-IN')}. Breakdown: MF ₹${(mf/100000).toFixed(1)}L, Stocks ₹${(stocks/100000).toFixed(1)}L, FD/PPF ₹${(fd/100000).toFixed(1)}L, Gold ₹${(gold/100000).toFixed(1)}L. Keep building! 📈`
    });
  }

  // Emergency fund check
  const emergencyTarget = expenses * 6;
  if (savings * 3 < emergencyTarget) {
    reminders.push({
      type: 'alert',
      title: '🏦 Emergency Fund Check',
      message: `Your emergency fund target is ₹${emergencyTarget.toLocaleString('en-IN')} (6 months expenses). You may be short — consider keeping 3-6 months expenses in a liquid fund or savings account.`
    });
  }

  // Couple mode reminder
  if (user.mode === 'couple') {
    reminders.push({
      type: 'reminder',
      title: '💕 Couple Finance Review',
      message: `Time for your monthly couple finance chat! Sit down with ${profile.partner_name || 'your partner'} and review your joint spending, SIPs, and savings goals together. Teamwork makes the dream work! 🤝`
    });
  }

  // Insert all reminders
  const stmt = db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)');
  for (const r of reminders) {
    stmt.run(userId, r.type, r.title, r.message);
  }

  // Log email simulation
  console.log(`[FinMate] 📧 Monthly reminders generated for ${user.name} (${user.email}) — ${reminders.length} notifications for ${monthName} ${now.getFullYear()}`);
}
