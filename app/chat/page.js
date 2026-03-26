'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ChatInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [mode, setMode] = useState('individual');
  const [userName, setUserName] = useState('');
  const msgsRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    Promise.all([
      fetch('/api/chat').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json())
    ]).then(([c, u]) => {
      if (u.error) { router.replace('/login'); return; }
      setMode(u.user.mode);
      setUserName(u.user.name);
      if (c.messages && c.messages.length > 0) {
        setMsgs(c.messages.map(m => ({ role: m.role === 'user' ? 'usr' : 'ai', text: m.content })));
      } else {
        setMsgs([{ role: 'ai', text: `👋 Hi ${u.user.name}! I'm your personal finance AI. What would you like to plan today?` }]);
      }
      const q = params.get('q');
      if (q) setTimeout(() => sendMsg(q), 500);
    });
  }, []);

  function scrollBottom() {
    setTimeout(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, 50);
  }

  async function sendMsg(text) {
    if (!text.trim()) return;
    const newMsgs = [...msgs, { role: 'usr', text }];
    setMsgs(newMsgs);
    setInput('');
    setTyping(true);
    scrollBottom();
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: text }) });
      const data = await res.json();
      setMsgs(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'ai', text: 'Sorry, I had an issue. Please try again.' }]);
    }
    setTyping(false);
    scrollBottom();
  }

  function handleKey(e) { if (e.key === 'Enter') { sendMsg(input); } }

  return (
    <div className={`chat-page ${mode === 'couple' ? 'couple-mode' : ''}`}>
      <div className="chat-hdr">
        <Link href="/dashboard" className="chat-back">←</Link>
        <div className="chat-av">🤖</div>
        <div>
          <div className="chat-hdr-name">FinMate AI</div>
          <div className="chat-hdr-status"><span className="chat-online"></span>Always here for you</div>
        </div>
      </div>
      <div className="chat-msgs" ref={msgsRef}>
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-bub">{m.text}</div>
            <div className="msg-time">{m.role === 'ai' ? 'FinMate AI' : 'You'} · just now</div>
          </div>
        ))}
        {typing && (
          <div className="msg ai">
            <div className="msg-bub"><div className="typing-wrap"><div className="tdot"></div><div className="tdot"></div><div className="tdot"></div></div></div>
          </div>
        )}
      </div>
      <div className="sug-row">
        {['Retire at 45?', 'SIP needed?', 'Tax regime?', 'Portfolio?', 'Emergency fund?'].map(s => (
          <button key={s} className="sug" onClick={() => sendMsg(s)}>{s}</button>
        ))}
      </div>
      <div className="chat-inp-row">
        <input className="chat-inp" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Ask anything about money…" />
        <button className="chat-send" onClick={() => sendMsg(input)}>➤</button>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"></div></div>}><ChatInner /></Suspense>;
}
