import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer } from 'lucide-react';

export default function QRCodes() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('*').order('id');
      return data ?? [];
    },
  });

  const baseUrl = window.location.origin;

  const toggleItem = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(items.map(i => i.id)));
  const deselectAll = () => setSelected(new Set());

  const handlePrint = () => {
    const selectedItems = items.filter(i => selected.has(i.id));
    if (selectedItems.length === 0) return;

    const html = `<!DOCTYPE html><html><head><title>QR Codes - StockFlow</title><style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 10mm; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8mm; }
      .card { border: 1px solid #ccc; border-radius: 4px; padding: 4mm; text-align: center; page-break-inside: avoid; }
      .card h3 { font-size: 11px; margin: 2mm 0 1mm; font-family: monospace; font-weight: bold; }
      .card p { font-size: 9px; margin: 1mm 0; color: #555; }
      .card img { margin: 2mm auto; }
      @media print { body { margin: 0; padding: 5mm; } }
    </style></head><body>
      <div class="grid">${selectedItems.map(item => `
        <div class="card">
          <h3>${item.id}</h3>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${baseUrl}/item/${item.id}`)}" width="100" height="100" />
          <p><strong>${item.name}</strong></p>
          <p>${item.model}</p>
          <p>📍 ${item.location}</p>
        </div>`).join('')}
      </div>
    </body></html>`;

    // Use iframe approach for better mobile compatibility
    let iframe = document.getElementById('print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      // Wait for images to load before printing
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 1000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">QR Codes</h1>
        <Button onClick={handlePrint} disabled={selected.size === 0}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir ({selected.size})
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={selectAll}>Selecionar Todos</Button>
        <Button variant="outline" size="sm" onClick={deselectAll}>Desmarcar Todos</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <Card key={item.id} className={`bg-card border-border cursor-pointer transition-colors ${selected.has(item.id) ? 'border-primary ring-1 ring-primary' : ''}`} onClick={() => toggleItem(item.id)}>
            <CardContent className="p-3 text-center space-y-2">
              <div className="flex items-center gap-2 justify-center">
                <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleItem(item.id)} />
                <span className="font-mono text-xs font-bold">{item.id}</span>
              </div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${baseUrl}/item/${item.id}`)}`} alt={`QR ${item.id}`} className="mx-auto rounded" width={100} height={100} />
              <p className="text-xs font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground truncate">{item.model}</p>
              <p className="text-xs text-muted-foreground">📍 {item.location}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
