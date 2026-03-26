import { NextResponse } from 'next/server';
const { getDb } = require('@/lib/db');
const { getUserFromRequest } = require('@/lib/auth');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function POST(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { message } = await request.json();
  const db = getDb();

  db.prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)').run(payload.id, 'user', message);

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(payload.id);
  const user = db.prepare('SELECT name, mode, partner_name FROM users WHERE id = ?').get(payload.id);
  const recentMessages = db.prepare('SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT 8').all(payload.id).reverse();

  let reply = '';
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    const nw = (profile.mutual_funds||0) + (profile.stocks||0) + (profile.fd_ppf||0) + (profile.gold||0);
    const surplus = (profile.income||0) - (profile.expenses||0) - (profile.emi||0);

    const systemPrompt = `You are FinMate AI, a warm friendly personal finance buddy in an Indian mobile app. Rules:
- Talk like a REAL FRIEND, not a robot. Match the user's tone.
- If casual (hi, bored, joke) → be fun & casual. Do NOT force financial advice.
- If they ask non-finance questions → answer naturally like a friend, then optionally connect to finance.
- Only give detailed financial advice when they specifically ask about money.
- Keep replies SHORT (2-3 paragraphs max).
- Use 1-3 emojis naturally.
- User: ${user.name}, age ${profile.age}, ${profile.city}, income ₹${profile.income}/mo, expenses ₹${profile.expenses}/mo, surplus ₹${surplus}/mo, NW ₹${nw}, risk ${profile.risk_level}, mode ${user.mode}`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: `Hey ${user.name}! 😊 What's up?` }] }
    ];
    for (const msg of recentMessages) {
      contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] });
    }

    // Try with retries for rate limiting
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: { temperature: 0.9, maxOutputTokens: 400 }
            })
          }
        );

        if (res.status === 429) {
          console.log(`[FinMate] Rate limited, retry ${attempt + 1}/3...`);
          await sleep(2000 * (attempt + 1));
          continue;
        }

        const data = await res.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = data.candidates[0].content.parts[0].text;
          break;
        }
        if (data.error) {
          console.error(`[FinMate] Gemini error: ${data.error.message}`);
          // Try alternate model
          if (attempt === 0) {
            const res2 = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents, generationConfig: { temperature: 0.9, maxOutputTokens: 400 } })
              }
            );
            const data2 = await res2.json();
            if (data2.candidates?.[0]?.content?.parts?.[0]?.text) {
              reply = data2.candidates[0].content.parts[0].text;
              break;
            }
          }
        }
      } catch (e) {
        console.error(`[FinMate] Fetch error attempt ${attempt}:`, e.message);
        await sleep(1000);
      }
    }
  }

  if (!reply) {
    reply = getSmartFallback(message, user.name, profile);
  }

  db.prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)').run(payload.id, 'ai', reply);
  return NextResponse.json({ reply });
}

function getSmartFallback(msg, name, profile) {
  const l = msg.toLowerCase().trim();
  const surplus = (profile.income||0) - (profile.expenses||0) - (profile.emi||0);
  const nw = (profile.mutual_funds||0) + (profile.stocks||0) + (profile.fd_ppf||0) + (profile.gold||0);

  // ── GREETINGS ──
  if (/^(hi+|hey+|hello+|hola|namaste|yo+|sup|wassup|good\s*(morning|afternoon|evening|night))/i.test(l)) {
    const h = new Date().getHours();
    const t = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
    return pick([
      `Hey ${name}! 👋 Good ${t.toLowerCase()}! How's it going?`,
      `Hi ${name}! 😊 ${t}! What's on your mind today?`,
      `${name}! 👋 Great to see you! How's your day been?`
    ]);
  }

  // ── BORED ──
  if (/bored|boring|nothing\s*to\s*do|timepass|kuch\s*nahi/i.test(l)) {
    return pick([
      `Haha I feel you ${name} 😄 Wanna play a quick money quiz? How much would ₹${Math.round(surplus * 0.3).toLocaleString('en-IN')}/month SIP grow in 20 years? Guess! ✨`,
      `Bored? Let me tell you something cool 🤓 If you invested ₹500/day since you were 20, you'd be a crorepati by 45! Want more fun facts?`,
      `Same energy some days 😄 Want me to check your financial health, tell a joke, or we can just vibe? Your call! 🎮`
    ]);
  }

  // ── THANKS ──
  if (/thanks|thank\s*you|thankyou|thx|ty|dhanyawad|shukriya/i.test(l)) {
    return `Anytime ${name}! 🤗 That's what I'm here for. Hit me up whenever!`;
  }

  // ── HOW ARE YOU ──
  if (/how\s*(are|r)\s*(you|u)|kaise\s*(ho|hai)|what'?s\s*up|how\s*do\s*you\s*do/i.test(l)) {
    return `I'm great ${name}, thanks for asking! 😊 How about you — everything good? Need help with anything?`;
  }

  // ── WHO ARE YOU ──
  if (/who\s*(are|r)\s*(you|u)|what\s*(are|can)\s*(you|u)|what\s*do\s*you\s*do|your\s*name/i.test(l)) {
    return `I'm FinMate AI — your personal money-savvy friend! 🤖💰 I can help with investing, tax, budgeting, retirement, or just chat about anything. What interests you?`;
  }

  // ── JOKES ──
  if (/joke|funny|laugh|meme|haha|lol|comedy/i.test(l)) {
    return pick([
      `Why did the stock market break up with its girlfriend? Too many "issues" 📈😂`,
      `What's a banker's favorite yoga pose? The balance sheet pose 🧘‍♂️😄`,
      `My financial advisor told me to live within my means. So I moved back with my parents 🏠😂`,
      `Why don't mutual funds ever get lonely? They always come in a diversified group! 📊😂`,
      `A bear walks into a bar. Bartender says "what'll it be?" Bear says "give me a... ... ... beer." Bartender: "Why the big pause?" Bear: "I was born with them" 🐻😂`
    ]);
  }

  // ── FEELING DOWN ──
  if (/sad|stressed|worried|anxious|tension|upset|depressed|not\s*(feel|do)ing\s*(good|well)|feel\s*bad|low/i.test(l)) {
    return `Hey ${name}, I'm here for you 💙 Take a deep breath, it's okay. If something's on your mind — financial or otherwise — just tell me. No judgment, just help. We'll figure it out together.`;
  }

  // ── COMPLIMENTS ──
  if (/you('?re|\s+(are))\s*(great|awesome|amazing|good|best|cool|smart|helpful)|love\s*you|nice|excellent/i.test(l)) {
    return `Aww ${name}, that made my day! 🥰 You're pretty awesome yourself for taking charge of your finances! 💪`;
  }

  // ── GOODBYE ──
  if (/good\s*night|bye|goodbye|see\s*you|later|tata|alvida/i.test(l)) {
    return `Bye ${name}! 🌙 Take care. Your investments are working 24/7 even while you rest! See you next time 😊`;
  }

  // ── AGE / PERSONAL ──
  if (/your\s*age|how\s*old\s*(are|r)/i.test(l)) {
    return `Haha I'm ageless ${name}! 😄 But I was born in 2024 if that counts. I might be young but I know a LOT about money! 💰`;
  }

  // ── WEATHER / TIME / DATE ──
  if (/weather|temperature|rain|sunny|cold|hot/i.test(l)) {
    return `I wish I could tell you about the weather ${name}! 🌤️ I'm more of an indoor, money-focused AI 😄 But hey, whether it's rainy or sunny — your SIP should always continue! ☂️📈`;
  }

  if (/time|date|day\s*today|what\s*day/i.test(l)) {
    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return `It's ${days[now.getDay()]}, ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} 📅 Time to check if your SIP went through this month? 😄`;
  }

  // ── FOOD / NON-FINANCE ──
  if (/food|eat|hungry|dinner|lunch|breakfast|pizza|biryani|restaurant/i.test(l)) {
    return `Now you're speaking my love language! 😋 I can't cook for you, but I can say — enjoy your meal and maybe keep it under budget 🍕💰 What's on the menu?`;
  }

  if (/movie|film|watch|netflix|show|series|song|music/i.test(l)) {
    return `Ooh nice! 🎬 I'm not the best movie critic but I'll say this — "The Big Short" is a MUST watch for anyone into finance! Great movie and you'll learn about markets too 😎`;
  }

  if (/game|play|cricket|football|sport|ipl/i.test(l)) {
    return `Ah sports talk! ⚽🏏 I'm more into the "investment game" haha but I love the energy! Did you know IPL teams are valued at billions now? Sports is serious business!`;
  }

  // ── LOVE / RELATIONSHIPS ──
  if (/love|girlfriend|boyfriend|relationship|marriage|partner|crush|date/i.test(l)) {
    return `Ah matters of the heart! 💕 I'm better with matters of the wallet 😄, but I'll say — financial compatibility is super important in relationships! Want to try our Couple Mode to plan together?`;
  }

  // ── CAREER / JOB ──
  if (/job|career|salary|promotion|hike|resign|switch|interview|work/i.test(l)) {
    return `Career talk! 💼 That's directly linked to your finance game. Quick tip: if you get a raise, invest at least 50% of the hike before lifestyle inflation kicks in! Want to discuss your financial strategy with your current income?`;
  }

  // ── SIP / INVEST ──
  if (/sip|mutual\s*fund|invest|where.*put.*money|start.*investing|stock|share|equity|portfolio/i.test(l)) {
    return `Great question ${name}! 📈 With your surplus of ₹${surplus.toLocaleString('en-IN')}/mo:\n\n• Index Fund SIP: ₹${Math.round(surplus * 0.4).toLocaleString('en-IN')}/mo\n• Emergency: ₹${Math.round(surplus * 0.2).toLocaleString('en-IN')}/mo\n• PPF/NPS: ₹${Math.round(surplus * 0.15).toLocaleString('en-IN')}/mo\n\nYour risk profile is ${profile.risk_level}. Want specific fund names?`;
  }

  // ── RETIRE / FIRE ──
  if (/retire|fire|financial\s*independence|early\s*retirement/i.test(l)) {
    return `FIRE is an awesome goal ${name}! 🔥 Check the FIRE Roadmap for your full plan. Quick tip: increasing SIP by 10% yearly can shave years off retirement! Want specifics?`;
  }

  // ── TAX ──
  if (/tax|80c|regime|deduction|save\s*tax|income\s*tax|itr/i.test(l)) {
    return `Smart! 💰 Quick tax wins:\n• 80C: max ₹1.5L (ELSS/PPF)\n• NPS: extra ₹50K\n• 80D: health insurance ₹25K\n\nCheck Tax Wizard for regime comparison!`;
  }

  // ── BUDGET ──
  if (/budget|expense|spending|save\s*more|cut.*cost|save\s*money|saving/i.test(l)) {
    const rate = profile.income > 0 ? Math.round(surplus / profile.income * 100) : 0;
    return `Your savings rate is ${rate}%! ${rate >= 30 ? '🎉 Amazing!' : rate >= 20 ? '💪 Good, aim for 30%!' : '🎯 Let\'s improve!'}\n\n50-30-20 rule:\n• Needs: ₹${Math.round(profile.income * 0.5).toLocaleString('en-IN')}\n• Wants: ₹${Math.round(profile.income * 0.3).toLocaleString('en-IN')}\n• Save: ₹${Math.round(profile.income * 0.2).toLocaleString('en-IN')}`;
  }

  // ── NET WORTH ──
  if (/net\s*worth|how\s*much.*have|total.*money|wealth/i.test(l)) {
    return `Your current net worth is ₹${nw >= 100000 ? (nw/100000).toFixed(1) + 'L' : nw.toLocaleString('en-IN')} 📊\n\nBreakdown:\n• MF: ₹${(profile.mutual_funds||0).toLocaleString('en-IN')}\n• Stocks: ₹${(profile.stocks||0).toLocaleString('en-IN')}\n• FD/PPF: ₹${(profile.fd_ppf||0).toLocaleString('en-IN')}\n• Gold: ₹${(profile.gold||0).toLocaleString('en-IN')}\n\nLet's grow this! 💪`;
  }

  // ── QUESTIONS (what, why, how, can, should, is, do, will) ──
  if (/^(what|why|how|can|should|is|do|will|where|when|which|tell\s*me|explain|describe)/i.test(l)) {
    return `That's a great question ${name}! 🤔 I'm best with finance stuff but I'll do my best. Could you give me a bit more context? I can help with:\n\n• 💰 Investments & SIP\n• 📊 Tax planning\n• 🔥 Retirement (FIRE)\n• 💸 Budgeting\n• 🏛️ Govt schemes\n\nOr just chat — I'm all ears! 😊`;
  }

  // ── CATCH-ALL ──
  return pick([
    `Hey ${name}! 😊 That's interesting! Tell me more — I can help with money stuff or just chat. What's on your mind?`,
    `Hmm ${name}, good one! 🤔 Want to talk about investments, tax, or budgeting? Or we can just keep chatting — I'm flexible! 😄`,
    `I hear you ${name}! 😄 I might not know everything, but I'm great with money matters. Need help with finances, or shall we just vibe? 🎵`
  ]);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export async function GET(request) {
  const payload = getUserFromRequest(request);
  if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const db = getDb();
  const messages = db.prepare('SELECT role, content, created_at FROM chat_messages WHERE user_id = ? ORDER BY id ASC LIMIT 100').all(payload.id);
  return NextResponse.json({ messages });
}
