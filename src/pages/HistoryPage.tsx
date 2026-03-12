import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function HistoryPage() {
  const { data: movements = [] } = useQuery({
    queryKey: ['movements-all'],
    queryFn: async () => {
      const { data } = await supabase.from('movements').select('*, items(name, id)').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Histórico de Movimentações</h1>

      {movements.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhuma movimentação registrada.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Tipo</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m: any) => (
                <TableRow key={m.id} className="border-border">
                  <TableCell>
                    <Badge className={m.type === 'entrada' ? 'bg-success/20 text-success border-0' : 'bg-destructive/20 text-destructive border-0'}>
                      {m.type === 'entrada' ? 'ENT↓' : 'SAÍ↑'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground mr-1">{m.items?.id}</span>
                    <span className="text-sm">{m.items?.name}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.reason || '—'}</TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={m.type === 'entrada' ? 'text-success' : 'text-destructive'}>
                      {m.type === 'entrada' ? '+' : '-'}{m.qty}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(m.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-sm">{m.user_name || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
