'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/fire', icon: '🔥', label: 'FIRE' },
  { href: '/portfolio', icon: '📊', label: 'Portfolio' },
  { href: '/chat', icon: '💬', label: 'AI Chat' },
  { href: '/tax', icon: '💰', label: 'Tax' }
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bnav">
      {TABS.map(t => (
        <Link key={t.href} href={t.href} className={`bnav-btn ${pathname === t.href ? 'on' : ''}`}>
          <div className="bnav-ico">{t.icon}</div>
          <div className="bnav-lbl">{t.label}</div>
          <div className="bnav-dot"></div>
        </Link>
      ))}
    </nav>
  );
}
