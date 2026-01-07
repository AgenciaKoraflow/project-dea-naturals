import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, User, MapPin, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useReturn } from '@/hooks/useReturns';
import { useMarketplaces } from '@/hooks/useMarketplaces';
import { getMarketplaceName } from '@/hooks/useMarketplaceLogos';
import { MarketplaceLogo } from '@/components/MarketplaceLogo';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReturnDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  
  const { data: returnData, isLoading } = useReturn(id!);
  const { data: marketplaces = [] } = useMarketplaces();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando detalhes...</div>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">Devolução não encontrada</h2>
        <Link to="/devolucoes">
          <Button variant="outline">Voltar para devoluções</Button>
        </Link>
      </div>
    );
  }

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

  const handleAction = (action: string) => {
    toast({
      title: `Devolução ${action}`,
      description: `A devolução ${returnData.order_id} foi ${action} com sucesso.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/devolucoes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{returnData.order_id}</h1>
          <p className="text-muted-foreground">Detalhes da devolução</p>
        </div>
        {getStatusBadge(returnData.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nome</p>
                  <p className="text-lg font-medium">{returnData.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg font-medium">{returnData.customer_email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informações do Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Produto</p>
                  <p className="text-lg font-medium">{returnData.product_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SKU</p>
                  <p className="text-lg font-medium">{returnData.product_sku}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Marketplace</p>
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <MarketplaceLogo name={getMarketplaceName(marketplaces, returnData.marketplace_id)} className="h-5 w-5" />
                    {getMarketplaceName(marketplaces, returnData.marketplace_id)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Motivo da Devolução
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{returnData.reason}</p>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notas Internas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Adicione notas sobre esta devolução..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <Button onClick={() => handleAction('atualizada')}>Salvar Notas</Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Valor</span>
                <span className="text-xl font-bold text-primary">R$ {returnData.refund_amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium">
                  {format(new Date(returnData.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(returnData.status)}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {returnData.status === 'pending' && (
                <>
                  <Button className="w-full" onClick={() => handleAction('aprovada')}>
                    Aprovar Devolução
                  </Button>
                  <Button className="w-full" variant="destructive" onClick={() => handleAction('rejeitada')}>
                    Rejeitar Devolução
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => handleAction('atualizada')}>
                    Solicitar Mais Informações
                  </Button>
                </>
              )}
              {returnData.status === 'approved' && (
                <Button className="w-full" onClick={() => handleAction('processada')}>
                  Processar Devolução
                </Button>
              )}
              {returnData.status === 'processing' && (
                <Button className="w-full" onClick={() => handleAction('concluída')}>
                  Marcar como Concluído
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Devolução criada</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(returnData.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-muted-foreground">Aguardando ação</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
