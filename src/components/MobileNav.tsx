import { LayoutDashboard, Package, QrCode, History, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Catálogo', url: '/catalog', icon: Package },
  { title: 'QR Codes', url: '/qr-codes', icon: QrCode },
  { title: 'Histórico', url: '/history', icon: History },
];

export function MobileNav() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const allItems = isAdmin ? [...items, { title: 'Admin', url: '/admin', icon: Shield }] : items;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
      <div className="flex justify-around py-2">
        {allItems.map((item) => {
          const active = location.pathname === item.url;
          return (
            <Link key={item.url} to={item.url} className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}>
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
