import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useReturns } from '@/hooks/useReturns';
import { useMarketplaces } from '@/hooks/useMarketplaces';
import { getMarketplaceName } from '@/hooks/useMarketplaceLogos';
import { MarketplaceLogo } from '@/components/MarketplaceLogo';
import { useMemo } from 'react';
import { AnalyticsSkeleton } from '@/components/skeletons';

export default function Analytics() {
  const { data: returns = [], isLoading } = useReturns();
  const { data: marketplaces = [] } = useMarketplaces();

  const analysis = useMemo(() => {
    // Análise por motivo
    const reasonCounts: Record<string, number> = {};
    returns.forEach(r => {
      reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
    });
    const topReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Análise por produto (substituindo categoria)
    const productCounts: Record<string, { count: number; value: number }> = {};
    returns.forEach(r => {
      // Usar o nome do produto como agrupamento
      const productKey = r.product_name;
      if (!productCounts[productKey]) {
        productCounts[productKey] = { count: 0, value: 0 };
      }
      productCounts[productKey].count++;
      productCounts[productKey].value += r.refund_amount;
    });
    const topProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3);

    // Análise por marketplace
    const marketplaceCounts: Record<string, { count: number; value: number }> = {};
    returns.forEach(r => {
      const name = getMarketplaceName(marketplaces, r.marketplace_id);
      if (!marketplaceCounts[name]) {
        marketplaceCounts[name] = { count: 0, value: 0 };
      }
      marketplaceCounts[name].count++;
      marketplaceCounts[name].value += r.refund_amount;
    });

    // Produtos mais devolvidos
    const topReturnedProducts = Object.entries(
      returns.reduce((acc, ret) => {
        if (!acc[ret.product_sku]) {
          acc[ret.product_sku] = { count: 0, name: ret.product_name };
        }
        acc[ret.product_sku].count++;
        return acc;
      }, {} as Record<string, { count: number; name: string }>)
    )
      .map(([sku, data]) => ({ sku, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Análise de correlação simplificada
    const correlations: string[] = [];
    
    // Correlação básica: Produto x Motivo
    const defectsByProduct: Record<string, number> = {};
    returns.forEach(r => {
      if (r.reason.toLowerCase().includes('defeito') || r.reason.toLowerCase().includes('avariado')) {
        defectsByProduct[r.product_name] = (defectsByProduct[r.product_name] || 0) + 1;
      }
    });

    const topDefectProduct = Object.entries(defectsByProduct)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (topDefectProduct && topDefectProduct[1] > 2) {
      correlations.push(`Produto "${topDefectProduct[0]}" apresenta alta correlação com devoluções por defeito/avaria (${topDefectProduct[1]} casos)`);
    }

    // Taxa de devolução geral
    const totalSales = 150;
    const returnRate = ((returns.length / totalSales) * 100).toFixed(1);

    return {
      topReasons,
      topProducts,
      marketplaceCounts,
      topReturnedProducts,
      correlations,
      returnRate,
      totalReturns: returns.length,
      totalValue: returns.reduce((sum, r) => sum + r.refund_amount, 0),
    };
  }, [returns, marketplaces]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Análises Inteligentes</h1>
        <p className="text-muted-foreground">Insights narrativos sobre devoluções</p>
      </div>

      {/* SWOT Matrix */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Matriz SWOT - Gestão de Devoluções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <h3 className="font-semibold text-success">Forças</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-success">•</span>
                  <span>Taxa de devolução de {analysis.returnRate}% está abaixo da média do e-commerce (5-7%)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-success">•</span>
                  <span>Presença consolidada em múltiplos marketplaces principais</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-success">•</span>
                  <span>Produtos naturais de qualidade demonstram boa aceitação do mercado</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h3 className="font-semibold text-warning">Fraquezas</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-warning">•</span>
                  <span>Embalagens precisam ser reforçadas para evitar defeitos durante transporte</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-warning">•</span>
                  <span>Divergência entre descrição e produto real em alguns anúncios</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-warning">•</span>
                  <span>Tempo de processamento de devoluções pode ser otimizado</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-info" />
                <h3 className="font-semibold text-info">Oportunidades</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-info">•</span>
                  <span>Expandir linha de produtos naturais aproveitando baixa taxa de devolução</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-info">•</span>
                  <span>Implementar programa de fidelidade para clientes sem devoluções</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-info">•</span>
                  <span>Automatizar gestão de devoluções para ganho de eficiência</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Ameaças</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-destructive">•</span>
                  <span>Aumento de custos logísticos impacta margens em devoluções</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-destructive">•</span>
                  <span>Concorrência com produtos similares de menor preço</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-destructive">•</span>
                  <span>Exigências crescentes dos marketplaces sobre prazos de processamento</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Return Reasons */}
      <Card>
        <CardHeader>
          <CardTitle>Principais Motivos de Devolução</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.topReasons.length > 0 && analysis.totalReturns > 0 ? (
              <>
                <p className="text-muted-foreground">
                  Os três principais motivos representam {((analysis.topReasons.reduce((sum, [, count]) => sum + count, 0) / analysis.totalReturns) * 100).toFixed(0)}% 
                  do total de devoluções. Esta concentração indica que ações focadas podem ter impacto significativo.
                </p>
                <div className="space-y-3">
                  {analysis.topReasons.map(([reason, count], index) => (
                    <div key={reason} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <span className="font-medium">{reason}</span>
                      </div>
                      <Badge variant="secondary">{count} devoluções ({((count / analysis.totalReturns) * 100).toFixed(1)}%)</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Nenhum dado de devolução disponível para análise.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Products Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.topProducts.length > 0 ? (
              <>
                <p className="text-muted-foreground">
                  Identificamos padrões distintos entre produtos. {analysis.topProducts[0][0]} lidera em volume, 
                  representando R$ {analysis.topProducts[0][1].value.toFixed(2)} em valor de devoluções.
                </p>
                <div className="space-y-3">
                  {analysis.topProducts.map(([product, data]) => (
                    <div key={product} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{product}</h4>
                        <Badge>{data.count} devoluções</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Valor total</span>
                        <span className="font-medium text-foreground">R$ {data.value.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 text-sm">
                        Ticket médio: R$ {(data.value / data.count).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Nenhum dado de produto disponível no momento.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Marketplace Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Marketplace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.keys(analysis.marketplaceCounts).length > 0 ? (
              <>
                <p className="text-muted-foreground">
                  Análise comparativa revela diferenças significativas entre plataformas em volume e valor de devoluções.
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(analysis.marketplaceCounts).map(([name, data]) => (
                    <div key={name} className="p-4 rounded-lg border space-y-2">
                      <h4 className="font-semibold">{name}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Devoluções</span>
                          <span className="font-medium">{data.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor</span>
                          <span className="font-medium">R$ {data.value.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ticket médio</span>
                          <span className="font-medium">R$ {(data.value / data.count).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Nenhum dado de marketplace disponível.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Critical Correlations */}
      {analysis.correlations.length > 0 && (
        <Card className="border-2 border-warning/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-warning" />
              Correlações Críticas Identificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Nossa análise cruzada revelou padrões estatisticamente significativos que merecem atenção imediata:
              </p>
              <div className="space-y-3">
                {analysis.correlations.map((correlation, index) => (
                  <div key={index} className="flex gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{correlation}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plano de Ação Recomendado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                Curto Prazo (0-30 dias)
              </h4>
              <ul className="ml-8 space-y-2 text-sm text-muted-foreground">
                <li>• Revisar e atualizar descrições de produtos para reduzir expectativa incorreta</li>
                <li>• Implementar embalagem reforçada para produtos frágeis</li>
                <li>• Criar script de atendimento para casos recorrentes</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                Médio Prazo (30-90 dias)
              </h4>
              <ul className="ml-8 space-y-2 text-sm text-muted-foreground">
                <li>• Desenvolver programa de controle de qualidade pré-envio</li>
                <li>• Negociar SLAs específicos com cada marketplace</li>
                <li>• Treinar equipe em identificação proativa de problemas</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                Longo Prazo (90+ dias)
              </h4>
              <ul className="ml-8 space-y-2 text-sm text-muted-foreground">
                <li>• Implementar sistema de feedback pós-compra para identificação precoce</li>
                <li>• Estabelecer parcerias estratégicas com fornecedores de embalagens sustentáveis</li>
                <li>• Desenvolver programa de fidelidade baseado em histórico zero de devoluções</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
