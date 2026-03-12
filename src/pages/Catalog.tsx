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
            <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge style={{ backgroundColor: item.categories?.color + '20', color: item.categories?.color, borderColor: item.categories?.color }} variant="outline" className="text-xs">
                    {item.categories?.icon} {item.categories?.name}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.model} — {item.manufacturer}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{item.qty} {item.unit}</span>
                  {item.qty <= item.min_qty && (
                    <Badge variant="destructive" className="text-xs">CRÍTICO</Badge>
                  )}
                </div>
                <StockBar qty={item.qty} minQty={item.min_qty} />
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
