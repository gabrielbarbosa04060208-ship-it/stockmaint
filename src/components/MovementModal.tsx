import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type Props = {
  open: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  type: 'entrada' | 'saida';
  currentQty: number;
};

export function MovementModal({ open, onClose, itemId, itemName, type, currentQty }: Props) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'saida' && qty > currentQty) {
      toast.error('Quantidade insuficiente em estoque');
      return;
    }
    setLoading(true);
    try {
      const { error: movError } = await supabase.from('movements').insert({
        item_id: itemId,
        type,
        qty,
        reason,
        user_name: userName,
      });
      if (movError) throw movError;

      const newQty = type === 'entrada' ? currentQty + qty : currentQty - qty;
      const { error: updateError } = await supabase.from('items').update({ qty: newQty }).eq('id', itemId);
      if (updateError) throw updateError;

      toast.success(`${type === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['critical-count'] });
      onClose();
      setQty(1);
      setReason('');
      setUserName('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar movimento');
    } finally {
      setLoading(false);
    }
  };

  const isEntrada = type === 'entrada';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className={isEntrada ? 'text-success' : 'text-destructive'}>
            {isEntrada ? '📥 Registrar Entrada' : '📤 Registrar Saída'} — {itemName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Quantidade</Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="font-mono" required />
          </div>
          <div>
            <Label>Motivo / OS</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: OS-2024-001" required />
          </div>
          <div>
            <Label>Responsável</Label>
            <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nome do técnico" required />
          </div>
          <Button type="submit" disabled={loading} className={isEntrada ? 'bg-success text-success-foreground hover:bg-success/90 w-full' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full'}>
            {loading ? 'Registrando...' : `Confirmar ${isEntrada ? 'Entrada' : 'Saída'}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
