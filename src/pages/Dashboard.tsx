import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, XCircle, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('*');
      return data ?? [];
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      const { data } = await supabase.from('movements').select('*, items(name, id)').order('created_at', { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  const totalItems = items.length;
  const criticalItems = items.filter(i => i.qty > 0 && i.qty <= i.min_qty);
  const outOfStock = items.filter(i => i.qty === 0);

  const stats = [
    { label: 'Total de Itens', value: totalItems, icon: Package, color: 'text-primary' },
    { label: 'Itens Críticos', value: criticalItems.length, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Sem Estoque', value: outOfStock.length, icon: XCircle, color: 'text-destructive' },
    { label: 'Movimentações', value: movements.length, icon: ArrowUpDown, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <span className="text-2xl font-mono font-bold">{s.value}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(criticalItems.length > 0 || outOfStock.length > 0) && (
        <Card className="bg-card border-warning/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-warning flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" /> Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outOfStock.map(item => (
              <Link key={item.id} to={`/item/${item.id}`} className="flex items-center justify-between p-2 rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors">
                <div>
                  <span className="font-mono text-sm text-destructive">{item.id}</span>
                  <span className="ml-2 text-sm">{item.name}</span>
                </div>
                <Badge variant="destructive">SEM ESTOQUE</Badge>
              </Link>
            ))}
            {criticalItems.map(item => (
              <Link key={item.id} to={`/item/${item.id}`} className="flex items-center justify-between p-2 rounded-md bg-warning/10 hover:bg-warning/20 transition-colors">
                <div>
                  <span className="font-mono text-sm text-warning">{item.id}</span>
                  <span className="ml-2 text-sm">{item.name}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{item.qty}/{item.min_qty} {item.unit}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
          ) : (
            <div className="space-y-2">
              {movements.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <Badge className={m.type === 'entrada' ? 'bg-success/20 text-success border-0' : 'bg-destructive/20 text-destructive border-0'}>
                      {m.type === 'entrada' ? 'ENT↓' : 'SAÍ↑'}
                    </Badge>
                    <span className="text-sm">{m.items?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{m.type === 'entrada' ? '+' : '-'}{m.qty}</span>
                    <span>{new Date(m.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
