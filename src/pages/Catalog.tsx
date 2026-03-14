import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StockBar } from '@/components/StockBar';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Catalog() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*');
      return data ?? [];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('*, categories(name, color, icon)');
      return data ?? [];
    },
  });

  const filtered = items.filter((item: any) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.model.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || item.category_id === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Catálogo</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, modelo ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={catFilter === null ? 'default' : 'outline'} size="sm" onClick={() => setCatFilter(null)}>Todos</Button>
        {categories.map((cat) => (
          <Button key={cat.id} variant={catFilter === cat.id ? 'default' : 'outline'} size="sm" onClick={() => setCatFilter(catFilter === cat.id ? null : cat.id)}>
            {cat.icon} {cat.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item: any) => (
          <Link key={item.id} to={`/item/${item.id}`}>
            <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
              {item.image_url && (
                <div className="w-full h-48 overflow-hidden">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-muted-foreground">{item.id}</span>
                  {item.qty <= item.min_qty ? (
                    <Badge variant="destructive" className="text-xs font-bold">Crítico</Badge>
                  ) : (
                    <Badge className="bg-success text-success-foreground text-xs font-bold">OK</Badge>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-base">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.model}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <span className="text-xs text-muted-foreground">Estoque</span>
                    <p className="font-bold text-lg">{item.qty} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Mínimo</span>
                    <p className="font-bold text-lg">{item.min_qty}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum item encontrado.</p>
      )}
    </div>
  );
}
