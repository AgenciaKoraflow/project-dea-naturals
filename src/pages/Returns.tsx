import { useState, useMemo } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReturns } from '@/hooks/useReturns';
import { useMarketplaces } from '@/hooks/useMarketplaces';
import { getMarketplaceName } from '@/hooks/useMarketplaceLogos';
import { MarketplaceLogo } from '@/components/MarketplaceLogo';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 20;

export default function Returns() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'created_at' | 'value'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: marketplaces = [] } = useMarketplaces();
  const { data: allReturns = [], isLoading } = useReturns({
    searchQuery,
    status: statusFilter,
    marketplaceId: marketplaceFilter,
  });

  const filteredReturns = useMemo(() => {
    const sorted = [...allReturns].sort((a, b) => {
      const aVal = sortField === 'created_at' ? new Date(a.created_at).getTime() : a.refund_amount;
      const bVal = sortField === 'created_at' ? new Date(b.created_at).getTime() : b.refund_amount;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [allReturns, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredReturns.length / ITEMS_PER_PAGE);
  const paginatedReturns = filteredReturns.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'outline' },
      approved: { label: 'Aprovado', variant: 'default' },
      rejected: { label: 'Rejeitado', variant: 'destructive' },
      processing: { label: 'Processando', variant: 'secondary' },
      completed: { label: 'Concluído', variant: 'default' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSort = (field: 'created_at' | 'value') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Pedido', 'Cliente', 'Email', 'Produto', 'SKU', 'Categoria', 'Marketplace', 'Motivo', 'Valor', 'Status', 'Data'],
      ...filteredReturns.map(r => [
        r.order_id,
        r.customer_name,
        r.customer_email,
        r.product_name,
        r.product_sku,
        'N/A', // Categoria não disponível
        getMarketplaceName(marketplaces, r.marketplace_id),
        r.reason,
        r.refund_amount.toFixed(2),
        r.status,
        new Date(r.created_at).toLocaleString('pt-BR'),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `devolucoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando devoluções...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devoluções</h1>
          <p className="text-muted-foreground">
            {filteredReturns.length} {filteredReturns.length === 1 ? 'resultado' : 'resultados'}
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por pedido, cliente ou produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por marketplace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os marketplaces</SelectItem>
                {marketplaces.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-medium">Pedido</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Produto</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Marketplace</th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort('value')}
                  >
                    Valor {sortField === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-sm font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort('created_at')}
                  >
                    Data {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReturns.map((ret) => (
                  <tr key={ret.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/devolucoes/${ret.id}`} className="font-medium text-primary hover:underline">
                        {ret.order_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">{ret.customer_name}</td>
                    <td className="px-6 py-4 text-sm">{ret.product_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MarketplaceLogo name={getMarketplaceName(marketplaces, ret.marketplace_id)} className="h-4 w-4" />
                        {getMarketplaceName(marketplaces, ret.marketplace_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">R$ {ret.refund_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(ret.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(ret.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
