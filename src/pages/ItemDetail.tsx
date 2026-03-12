import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StockBar } from '@/components/StockBar';
import { MovementModal } from '@/components/MovementModal';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Wrench, FileText, Package } from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [modalType, setModalType] = useState<'entrada' | 'saida' | null>(null);

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('*, categories(name, color, icon)').eq('id', id!).single();
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Carregando...</div>;
  if (!item) return <div className="flex items-center justify-center py-20 text-muted-foreground">Item não encontrado.</div>;

  const cat = item.categories as any;
  const statusColor = item.qty === 0 ? 'text-destructive' : item.qty <= item.min_qty ? 'text-warning' : 'text-success';
  const statusLabel = item.qty === 0 ? 'SEM ESTOQUE' : item.qty <= item.min_qty ? 'CRÍTICO' : 'OK';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(window.location.href)}`;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge style={{ backgroundColor: cat?.color + '20', color: cat?.color, borderColor: cat?.color }} variant="outline">
              {cat?.icon} {cat?.name}
            </Badge>
            <span className="font-mono text-sm text-muted-foreground">{item.id}</span>
          </div>
          <h1 className="text-xl font-bold">{item.name}</h1>
          <p className="text-sm text-muted-foreground">{item.model} — {item.manufacturer}</p>
        </div>
        <img src={qrUrl} alt="QR Code" className="rounded-md border border-border" width={100} height={100} />
      </div>

      {/* Photo */}
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover rounded-lg border border-border" />
      ) : (
        <div className="w-full h-48 bg-secondary rounded-lg flex items-center justify-center">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
      )}

      {/* Stock status */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Estoque Atual</span>
            <Badge variant={item.qty === 0 ? 'destructive' : item.qty <= item.min_qty ? 'outline' : 'default'} className={item.qty <= item.min_qty && item.qty > 0 ? 'border-warning text-warning' : ''}>
              {statusLabel}
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-mono font-bold ${statusColor}`}>{item.qty}</span>
            <span className="text-sm text-muted-foreground">/ mín: {item.min_qty} {item.unit}</span>
          </div>
          <StockBar qty={item.qty} minQty={item.min_qty} className="mt-3" />
        </CardContent>
      </Card>

      {/* Description */}
      {item.description && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Descrição Técnica</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{item.description}</p></CardContent>
        </Card>
      )}

      {/* Maintenance notes */}
      {item.maintenance_notes && (
        <Card className="bg-card border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-success"><Wrench className="h-4 w-4" /> Notas de Manutenção</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-success/80">{item.maintenance_notes}</p></CardContent>
        </Card>
      )}

      {/* Location */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex items-center gap-3">
          <MapPin className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Localização</p>
            <p className="font-mono font-semibold">{item.location}</p>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons - only for authenticated users */}
      {user && (
        <div className="grid grid-cols-2 gap-3">
          <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => setModalType('saida')}>
            📤 Registrar Saída
          </Button>
          <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => setModalType('entrada')}>
            📥 Registrar Entrada
          </Button>
        </div>
      )}

      {modalType && (
        <MovementModal open={!!modalType} onClose={() => setModalType(null)} itemId={item.id} itemName={item.name} type={modalType} currentQty={item.qty} />
      )}
    </div>
  );
}
