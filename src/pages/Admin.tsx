import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Navigate } from 'react-router-dom';

type ItemForm = {
  id: string; category_id: string; name: string; model: string; manufacturer: string;
  qty: number; min_qty: number; unit: string; location: string; description: string; maintenance_notes: string;
};

const emptyForm: ItemForm = {
  id: '', category_id: '', name: '', model: '', manufacturer: '',
  qty: 0, min_qty: 0, unit: 'un', location: '', description: '', maintenance_notes: '',
};

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<ItemForm | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('*, categories(name, icon)').order('id');
      return data ?? [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*');
      return data ?? [];
    },
  });

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      if (isNew) {
        const { error } = await supabase.from('items').insert(editItem);
        if (error) throw error;
        toast.success('Item criado!');
      } else {
        const { id, ...rest } = editItem;
        const { error } = await supabase.from('items').update(rest).eq('id', id);
        if (error) throw error;
        toast.success('Item atualizado!');
      }
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['critical-count'] });
      setEditItem(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Deletar item ${id}?`)) return;
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Item deletado!');
    queryClient.invalidateQueries({ queryKey: ['items'] });
    queryClient.invalidateQueries({ queryKey: ['critical-count'] });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editItem) return;
    const path = `${editItem.id}/${file.name}`;
    const { error } = await supabase.storage.from('item-photos').upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('item-photos').getPublicUrl(path);
    setEditItem({ ...editItem, ...(({ image_url: publicUrl } as any)) });
    toast.success('Foto enviada!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Administração</h1>
        <Button onClick={() => { setEditItem(emptyForm); setIsNew(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Item
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item: any) => (
          <Card key={item.id} className="bg-card border-border">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-sm text-primary mr-2">{item.id}</span>
                <span className="text-sm">{item.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{item.categories?.icon} {item.categories?.name}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditItem({ id: item.id, category_id: item.category_id, name: item.name, model: item.model, manufacturer: item.manufacturer, qty: item.qty, min_qty: item.min_qty, unit: item.unit, location: item.location, description: item.description || '', maintenance_notes: item.maintenance_notes || '' }); setIsNew(false); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editItem} onOpenChange={(v) => !v && setEditItem(null)}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? 'Novo Item' : `Editar ${editItem?.id}`}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-3">
              {isNew && (
                <div><Label>Código (ex: GV-011)</Label><Input value={editItem.id} onChange={(e) => setEditItem({ ...editItem, id: e.target.value })} /></div>
              )}
              <div><Label>Categoria</Label>
                <Select value={editItem.category_id} onValueChange={(v) => setEditItem({ ...editItem, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Nome</Label><Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} /></div>
              <div><Label>Modelo</Label><Input value={editItem.model} onChange={(e) => setEditItem({ ...editItem, model: e.target.value })} /></div>
              <div><Label>Fabricante</Label><Input value={editItem.manufacturer} onChange={(e) => setEditItem({ ...editItem, manufacturer: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Quantidade</Label><Input type="number" value={editItem.qty} onChange={(e) => setEditItem({ ...editItem, qty: Number(e.target.value) })} /></div>
                <div><Label>Mín.</Label><Input type="number" value={editItem.min_qty} onChange={(e) => setEditItem({ ...editItem, min_qty: Number(e.target.value) })} /></div>
                <div><Label>Unidade</Label>
                  <Select value={editItem.unit} onValueChange={(v) => setEditItem({ ...editItem, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">un</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="litros">litros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Localização</Label><Input value={editItem.location} onChange={(e) => setEditItem({ ...editItem, location: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={editItem.description} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} /></div>
              <div><Label>Notas de Manutenção</Label><Textarea value={editItem.maintenance_notes} onChange={(e) => setEditItem({ ...editItem, maintenance_notes: e.target.value })} /></div>
              <div><Label>Foto</Label><Input type="file" accept="image/*" onChange={handlePhotoUpload} /></div>
              <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
