import { useState, useMemo } from 'react';
import { Package, TrendingUp, Clock, DollarSign, Search, CalendarIcon } from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useReturns } from '@/hooks/useReturns';
import { useMarketplaces } from '@/hooks/useMarketplaces';
import { MarketplaceLogo } from '@/components/MarketplaceLogo';
import { getMarketplaceName } from '@/hooks/useMarketplaceLogos';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { DashboardSkeleton } from '@/components/skeletons';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<{
    title: string;
    data: any;
    type: 'total' | 'pending' | 'value' | 'rate';
  } | null>(null);

  const { data: marketplaces = [] } = useMarketplaces();
  const { data: returns = [], isLoading } = useReturns({
    searchQuery,
    startDate,
    endDate,
  });

  const openDialog = (type: 'total' | 'pending' | 'value' | 'rate', data: any) => {
    setDialogContent({ title: getTitleForType(type), data, type });
    setDialogOpen(true);
  };

  const getTitleForType = (type: string) => {
    const titles = {
      total: 'Detalhes - Total de Devoluções',
      pending: 'Detalhes - Devoluções Pendentes',
      value: 'Detalhes - Valor Total',
      rate: 'Detalhes - Taxa de Devolução',
    };
    return titles[type as keyof typeof titles] || 'Detalhes';
  };

  const stats = useMemo(() => {
    const total = returns.length;
    const pending = returns.filter(r => r.status === 'pending').length;
    const totalValue = returns.reduce((sum, r) => sum + r.refund_amount, 0);
    const returnRate = ((total / 150) * 100).toFixed(1);

    // Marketplace breakdown for total returns
    const marketplaceBreakdown = marketplaces.map(mp => {
      const count = returns.filter(r => r.marketplace_id === mp.id).length;
      return {
        label: mp.name,
        value: count,
        icon: <MarketplaceLogo name={mp.name} className="h-4 w-4" />
      };
    }).filter(item => item.value > 0);

    // Marketplace breakdown for pending returns
    const pendingBreakdown = marketplaces.map(mp => {
      const count = returns.filter(r => r.marketplace_id === mp.id && r.status === 'pending').length;
      return {
        label: mp.name,
        value: count,
        icon: <MarketplaceLogo name={mp.name} className="h-4 w-4" />
      };
    }).filter(item => item.value > 0);

    // Marketplace breakdown for total value
    const valueBreakdown = marketplaces.map(mp => {
      const value = returns
        .filter(r => r.marketplace_id === mp.id)
        .reduce((sum, r) => sum + r.refund_amount, 0);
      return {
        label: mp.name,
        value: formatCurrency(value),
        icon: <MarketplaceLogo name={mp.name} className="h-4 w-4" />
      };
    }).filter(item => parseFloat(item.value.replace(/[^0-9,]/g, '').replace(',', '.')) > 0);

    // Marketplace breakdown for return rate
    const rateBreakdown = marketplaces.map(mp => {
      const count = returns.filter(r => r.marketplace_id === mp.id).length;
      const rate = ((count / 150) * 100).toFixed(1);
      return {
        label: mp.name,
        value: `${rate}%`,
        icon: <MarketplaceLogo name={mp.name} className="h-4 w-4" />
      };
    }).filter(item => parseFloat(item.value) > 0);

    return { 
      total, 
      pending, 
      totalValue, 
      returnRate, 
      marketplaceBreakdown,
      pendingBreakdown,
      valueBreakdown,
      rateBreakdown
    };
  }, [returns, marketplaces]);

  const chartData = useMemo(() => {
    // Group by date for timeline chart
    const dailyData: Record<string, number> = {};
    
    returns.forEach(ret => {
      const date = startOfDay(parseISO(ret.request_date));
      const dateKey = format(date, 'dd/MM', { locale: ptBR });
      dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
    });
    
    // Convert to array format for recharts
    return Object.entries(dailyData)
      .map(([date, total]) => ({
        date,
        total
      }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split('/').map(Number);
        const [dayB, monthB] = b.date.split('/').map(Number);
        const dateA = new Date(2024, monthA - 1, dayA);
        const dateB = new Date(2024, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      });
  }, [returns]);

  const topProducts = useMemo(() => {
    const productCounts: Record<string, { count: number; name: string }> = {};
    returns.forEach(ret => {
      if (!productCounts[ret.product_sku]) {
        productCounts[ret.product_sku] = { count: 0, name: ret.product_name };
      }
      productCounts[ret.product_sku].count++;
    });
    return Object.entries(productCounts)
      .map(([sku, data]) => ({ sku, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [returns]);

  const recentReturns = useMemo(() => {
    return returns.slice(0, 10);
  }, [returns]);

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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das devoluções</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal w-full sm:w-[160px]",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data Início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal w-full sm:w-[160px]",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data Fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por pedido, cliente ou produto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Devoluções"
          value={stats.total}
          icon={Package}
          trend={{ value: 12, isPositive: false }}
          subdivision={stats.marketplaceBreakdown}
          onClick={() => openDialog('total', { returns, marketplaces })}
        />
        <StatCard
          title="Devoluções Pendentes"
          value={stats.pending}
          icon={Clock}
          trend={{ value: 8, isPositive: false }}
          subdivision={stats.pendingBreakdown}
          onClick={() => openDialog('pending', returns.filter(r => r.status === 'pending'))}
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(stats.totalValue)}
          icon={DollarSign}
          trend={{ value: 15, isPositive: false }}
          subdivision={stats.valueBreakdown}
          onClick={() => openDialog('value', { totalValue: stats.totalValue, returns })}
        />
        <StatCard
          title="Taxa de Devolução"
          value={`${stats.returnRate}%`}
          icon={TrendingUp}
          trend={{ value: 2, isPositive: true }}
          subdivision={stats.rateBreakdown}
          onClick={() => openDialog('rate', { rate: stats.returnRate, total: stats.total })}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => openDialog('total', { chartData, returns })}
        >
          <CardHeader>
            <CardTitle>Devoluções no Período Selecionado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Total de Devoluções"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => openDialog('total', { topProducts, type: 'products' })}
        >
          <CardHeader>
            <CardTitle>Top 5 Produtos Devolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.sku} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{product.count} devoluções</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Returns Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Devoluções Recentes</CardTitle>
          <Link to="/devolucoes">
            <Button variant="outline" size="sm">Ver todas</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3">Pedido</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Produto</th>
                  <th className="pb-3">Marketplace</th>
                  <th className="pb-3">Valor</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentReturns.map((ret) => (
                  <tr key={ret.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3">
                      <Link to={`/devolucoes/${ret.id}`} className="font-medium text-primary hover:underline">
                        {ret.order_id}
                      </Link>
                    </td>
                    <td className="py-3 text-sm">{ret.customer_name}</td>
                    <td className="py-3 text-sm">{ret.product_name}</td>
                    <td className="py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MarketplaceLogo name={getMarketplaceName(marketplaces, ret.marketplace_id)} className="h-4 w-4" />
                        {getMarketplaceName(marketplaces, ret.marketplace_id)}
                      </div>
                    </td>
                    <td className="py-3 text-sm font-medium">{formatCurrency(ret.refund_amount)}</td>
                    <td className="py-3">{getStatusBadge(ret.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogContent?.title}</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre este indicador
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {dialogContent?.type === 'total' && dialogContent.data.returns && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total de Devoluções</p>
                    <p className="text-2xl font-bold mt-1">{dialogContent.data.returns.length}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Marketplaces Ativos</p>
                    <p className="text-2xl font-bold mt-1">{dialogContent.data.marketplaces?.length || 0}</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Distribuição por Marketplace</h4>
                  <div className="space-y-3">
                    {stats.marketplaceBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <Badge variant="secondary">{item.value} devoluções</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {dialogContent?.type === 'pending' && Array.isArray(dialogContent.data) && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {dialogContent.data.length} devolução(ões) aguardando processamento
                </p>
                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {dialogContent.data.slice(0, 10).map((ret: any) => (
                    <div key={ret.id} className="p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{ret.order_id}</p>
                          <p className="text-sm text-muted-foreground">{ret.customer_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{ret.product_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(ret.refund_amount)}</p>
                          <Badge variant="outline" className="mt-1">Pendente</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {dialogContent?.type === 'value' && dialogContent.data && (
              <div className="space-y-4">
                <div className="p-6 border rounded-lg bg-primary/5">
                  <p className="text-sm text-muted-foreground mb-2">Valor Total em Devoluções</p>
                  <p className="text-4xl font-bold">{formatCurrency(dialogContent.data.totalValue)}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Média por Devolução</p>
                    <p className="text-lg font-bold mt-1">
                      {formatCurrency(dialogContent.data.totalValue / (dialogContent.data.returns?.length || 1))}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Total de Itens</p>
                    <p className="text-lg font-bold mt-1">{dialogContent.data.returns?.length || 0}</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-lg font-bold mt-1 text-destructive">-{formatCurrency(dialogContent.data.totalValue)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {dialogContent?.type === 'rate' && dialogContent.data && (
              <div className="space-y-4">
                <div className="p-6 border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Taxa de Devolução</p>
                  <p className="text-4xl font-bold">{dialogContent.data.rate}%</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Baseado em {dialogContent.data.total} devoluções
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Análise</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Taxa calculada com base em estimativa de 150 pedidos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Recomendado: manter abaixo de 5% para e-commerce</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Monitore tendências mensais para identificar padrões</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
