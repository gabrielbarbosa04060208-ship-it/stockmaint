import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, ShieldCheck, ShieldOff } from 'lucide-react';
import { Navigate } from 'react-router-dom';

type ItemForm = {
  id: string; category_id: string; name: string; model: string; manufacturer: string;
  qty: number; min_qty: number; unit: string; location: string; description: string; maintenance_notes: string;
};

type CategoryForm = {
  id: string; name: string; icon: string; color: string;
};

const emptyItem: ItemForm = {
  id: '', category_id: '', name: '', model: '', manufacturer: '',
  qty: 0, min_qty: 0, unit: 'un', location: '', description: '', maintenance_notes: '',
};

const emptyCategory: CategoryForm = { id: '', name: '', icon: '📦', color: '#3b82f6' };

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();

  // Item state
  const [editItem, setEditItem] = useState<ItemForm | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Category state
  const [editCategory, setEditCategory] = useState<CategoryForm | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

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

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*');
      return data ?? [];
    },
  });

  const { data: allRoles = [] } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('*');
      return data ?? [];
    },
  });

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  // === ITEM HANDLERS ===
  const handleSaveItem = async () => {
    if (!editItem) return;
    setSavingItem(true);
    try {
      if (isNewItem) {
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
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
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

  // === CATEGORY HANDLERS ===
  const handleSaveCategory = async () => {
    if (!editCategory) return;
    setSavingCategory(true);
    try {
      if (isNewCategory) {
        const { error } = await supabase.from('categories').insert(editCategory);
        if (error) throw error;
        toast.success('Categoria criada!');
      } else {
        const { id, ...rest } = editCategory;
        const { error } = await supabase.from('categories').update(rest).eq('id', id);
        if (error) throw error;
        toast.success('Categoria atualizada!');
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditCategory(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(`Deletar categoria ${id}? Itens vinculados podem ser afetados.`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Categoria deletada!');
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  // === USER ROLE HANDLERS ===
  const getUserRoles = (userId: string) => allRoles.filter((r: any) => r.user_id === userId);

  const handleToggleRole = async (userId: string, role: 'admin' | 'tecnico', hasRole: boolean) => {
    if (hasRole) {
      const roleEntry = allRoles.find((r: any) => r.user_id === userId && r.role === role);
      if (!roleEntry) return;
      const { error } = await supabase.from('user_roles').delete().eq('id', roleEntry.id);
      if (error) { toast.error(error.message); return; }
      toast.success(`Role "${role}" removida!`);
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) { toast.error(error.message); return; }
      toast.success(`Role "${role}" adicionada!`);
    }
    queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Administração</h1>

      <Tabs defaultValue="items">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        {/* === ITEMS TAB === */}
        <TabsContent value="items" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => { setEditItem(emptyItem); setIsNewItem(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Novo Item
            </Button>
          </div>
          {items.map((item: any) => (
            <Card key={item.id} className="bg-card border-border">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm text-primary mr-2">{item.id}</span>
                  <span className="text-sm">{item.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{item.categories?.icon} {item.categories?.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditItem({
                      id: item.id, category_id: item.category_id, name: item.name, model: item.model,
                      manufacturer: item.manufacturer, qty: item.qty, min_qty: item.min_qty, unit: item.unit,
                      location: item.location, description: item.description || '', maintenance_notes: item.maintenance_notes || '',
                    });
                    setIsNewItem(false);
                  }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* === CATEGORIES TAB === */}
        <TabsContent value="categories" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => { setEditCategory(emptyCategory); setIsNewCategory(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nova Categoria
            </Button>
          </div>
          {categories.map((cat: any) => (
            <Card key={cat.id} className="bg-card border-border">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-mono text-sm text-primary">{cat.id}</span>
                  <span className="text-sm">{cat.name}</span>
                  <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditCategory({ id: cat.id, name: cat.name, icon: cat.icon, color: cat.color });
                    setIsNewCategory(false);
                  }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(cat.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* === USERS TAB === */}
        <TabsContent value="users" className="space-y-3">
          {profiles.map((profile: any) => {
            const roles = getUserRoles(profile.user_id);
            const hasAdmin = roles.some((r: any) => r.role === 'admin');
            const hasTecnico = roles.some((r: any) => r.role === 'tecnico');
            return (
              <Card key={profile.id} className="bg-card border-border">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{profile.email}</span>
                    <div className="flex gap-1">
                      {hasAdmin && <Badge variant="default">Admin</Badge>}
                      {hasTecnico && <Badge variant="secondary">Técnico</Badge>}
                      {!hasAdmin && !hasTecnico && <Badge variant="outline">Sem role</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={hasAdmin ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleToggleRole(profile.user_id, 'admin', hasAdmin)}
                      title={hasAdmin ? 'Remover Admin' : 'Tornar Admin'}
                    >
                      {hasAdmin ? <ShieldOff className="h-3 w-3 mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
                      Admin
                    </Button>
                    <Button
                      variant={hasTecnico ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleToggleRole(profile.user_id, 'tecnico', hasTecnico)}
                      title={hasTecnico ? 'Remover Técnico' : 'Tornar Técnico'}
                    >
                      {hasTecnico ? <ShieldOff className="h-3 w-3 mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
                      Técnico
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {profiles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum usuário cadastrado.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* === ITEM DIALOG === */}
      <Dialog open={!!editItem} onOpenChange={(v) => !v && setEditItem(null)}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNewItem ? 'Novo Item' : `Editar ${editItem?.id}`}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-3">
              {isNewItem && (
                <div><Label>Código (ex: GV-011)</Label><Input value={editItem.id} onChange={(e) => setEditItem({ ...editItem, id: e.target.value })} /></div>
              )}
              <div><Label>Categoria</Label>
                <Select value={editItem.category_id} onValueChange={(v) => setEditItem({ ...editItem, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
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
              <Button onClick={handleSaveItem} disabled={savingItem} className="w-full">{savingItem ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* === CATEGORY DIALOG === */}
      <Dialog open={!!editCategory} onOpenChange={(v) => !v && setEditCategory(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{isNewCategory ? 'Nova Categoria' : `Editar ${editCategory?.name}`}</DialogTitle>
          </DialogHeader>
          {editCategory && (
            <div className="space-y-3">
              <div><Label>Código (ex: ROL)</Label><Input value={editCategory.id} onChange={(e) => setEditCategory({ ...editCategory, id: e.target.value })} disabled={!isNewCategory} /></div>
              <div><Label>Nome</Label><Input value={editCategory.name} onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} /></div>
              <div><Label>Ícone (emoji)</Label><Input value={editCategory.icon} onChange={(e) => setEditCategory({ ...editCategory, icon: e.target.value })} /></div>
              <div><Label>Cor</Label><Input type="color" value={editCategory.color} onChange={(e) => setEditCategory({ ...editCategory, color: e.target.value })} /></div>
              <Button onClick={handleSaveCategory} disabled={savingCategory} className="w-full">{savingCategory ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
