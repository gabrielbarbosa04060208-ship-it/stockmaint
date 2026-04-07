import { LayoutDashboard, Package, QrCode, History, Shield, LogOut, LogIn } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: criticalCount = 0 } = useQuery({
    queryKey: ['critical-count'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('id, qty, min_qty');
      return data?.filter(i => i.qty <= i.min_qty).length ?? 0;
    },
  });

  const navItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Catálogo', url: '/catalog', icon: Package },
    { title: 'QR Codes', url: '/qr-codes', icon: QrCode },
    { title: 'Histórico', url: '/history', icon: History },
  ];

  if (isAdmin) {
    navItems.push({ title: 'Admin', url: '/admin', icon: Shield });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">StockFlow</h1>
              <p className="text-xs text-muted-foreground">Manutenção Industrial</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-accent" activeClassName="bg-accent text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && item.url === '/dashboard' && criticalCount > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0.5">
                          {criticalCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-2">
        {user ? (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sair</span>}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => navigate('/login')}>
            <LogIn className="h-4 w-4" />
            {!collapsed && <span>Entrar</span>}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
