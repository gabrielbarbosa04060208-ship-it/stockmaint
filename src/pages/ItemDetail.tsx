import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MovementModal } from '@/components/MovementModal';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Package } from 'lucide-react';

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

  const { data: movements } = useQuery({
    queryKey: ['movements', id],
    queryFn: async () => {
      const { data } = await supabase.from('movements').select('*').eq('item_id', id!).order('created_at', { ascending: false }).limit(5);
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Carregando...</div>;
  if (!item) return <div className="flex items-center justify-center py-20 text-muted-foreground">Item não encontrado.</div>;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/catalog" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
        <ArrowLeft className="h-4 w-4" /> Voltar ao Catálogo
      </Link>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Image */}
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-64 object-cover rounded-lg border border-border" />
          ) : (
            <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center border border-border">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {/* ID and Title */}
          <div>
            <p className="text-sm text-primary font-mono mb-1">{item.id}</p>
            <h1 className="text-2xl font-bold text-foreground">{item.name}</h1>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-b border-border py-4">
            <div>
              <p className="text-sm text-muted-foreground">Modelo</p>
              <p className="font-semibold text-foreground">{item.model}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fabricante</p>
              <p className="font-semibold text-foreground">{item.manufacturer}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Localização</p>
              <p className="font-semibold text-foreground">{item.location}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unidade</p>
              <p className="font-semibold text-foreground">{item.unit}</p>
            </div>
          </div>

          {/* Technical description */}
          {item.description && (
            <div>
              <h2 className="font-semibold text-foreground mb-2">Descrição Técnica</h2>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          )}

          {/* Maintenance notes */}
          {item.maintenance_notes && (
            <Card className="bg-accent/30 border-accent">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-2">Notas de Manutenção</h3>
                <p className="text-muted-foreground">{item.maintenance_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Recent movements */}
          {movements && movements.length > 0 && (
            <div>
              <h2 className="font-semibold text-foreground mb-4">Movimentações Recentes</h2>
              <div className="space-y-3">
                {movements.map((mov) => (
                  <Card key={mov.id} className="bg-card border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${mov.type === 'saida' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                          {mov.type === 'saida' ? 'Saída' : 'Entrada'}
                        </span>
                        <span className="text-sm text-muted-foreground">{mov.reason}</span>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${mov.type === 'saida' ? 'text-destructive' : 'text-success'}`}>
                          {mov.type === 'saida' ? '-' : '+'}{mov.qty}
                        </p>
                        <p className="text-xs text-muted-foreground">{mov.date}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Stock status */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status do Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-primary">Quantidade Atual</p>
                <p className="text-4xl font-bold text-foreground">{item.qty}</p>
                <p className="text-sm text-muted-foreground">{item.unit}</p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm text-primary">Estoque Mínimo</p>
                <p className="text-2xl font-bold text-foreground">{item.min_qty}</p>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
              <p className="text-sm font-mono text-muted-foreground mt-2">{item.id}</p>
            </CardContent>
          </Card>

          {/* Action buttons */}
          {user && (
            <div className="space-y-3">
              <Button className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground h-12 text-base" onClick={() => setModalType('saida')}>
                Registrar Saída
              </Button>
              <Button className="w-full bg-success hover:bg-success/90 text-success-foreground h-12 text-base" onClick={() => setModalType('entrada')}>
                Registrar Entrada
              </Button>
            </div>
          )}
        </div>
      </div>

      {modalType && (
        <MovementModal open={!!modalType} onClose={() => setModalType(null)} itemId={item.id} itemName={item.name} type={modalType} currentQty={item.qty} />
      )}
    </div>
  );
}
