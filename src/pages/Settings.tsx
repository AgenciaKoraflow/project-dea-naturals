import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { marketplaces, Marketplace } from '@/lib/mockData';
import { useState } from 'react';
import { Settings2, CheckCircle2, XCircle } from 'lucide-react';
import { MarketplaceConfigDialog, MarketplaceConfig } from '@/components/MarketplaceConfigDialog';
import { MarketplaceLogo } from '@/components/MarketplaceLogo';

// Estado inicial das configurações de cada marketplace
const initialConfigs: Record<string, MarketplaceConfig> = {
  '1': { apiKey: '', clientId: '', clientSecret: '', accessToken: '', refreshToken: '', sellerId: '', enabled: false },
  '2': { apiKey: '', apiSecret: '', sellerId: '', refreshToken: '', clientId: '', clientSecret: '', enabled: false },
  '3': { apiKey: '', clientId: '', sellerId: '', accessToken: '', refreshToken: '', enabled: false },
  '4': { apiKey: '', apiSecret: '', sellerId: '', accessToken: '', enabled: false },
  '5': { apiKey: '', apiSecret: '', storeUrl: '', enabled: false },
};

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configs, setConfigs] = useState<Record<string, MarketplaceConfig>>(initialConfigs);

  const handleConfigClick = (marketplace: Marketplace) => {
    setSelectedMarketplace(marketplace);
    setDialogOpen(true);
  };

  const handleSaveConfig = (config: MarketplaceConfig) => {
    if (selectedMarketplace) {
      setConfigs(prev => ({
        ...prev,
        [selectedMarketplace.id]: config,
      }));
    }
  };

  const isConfigured = (marketplaceId: string) => {
    const config = configs[marketplaceId];
    return config && config.apiKey && config.enabled;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas integrações e preferências</p>
      </div>

      {/* Marketplaces */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplaces Conectados</CardTitle>
          <CardDescription>Clique em "Configurar" para adicionar as credenciais de API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketplaces.map((marketplace) => {
              const configured = isConfigured(marketplace.id);
              const config = configs[marketplace.id];
              
              return (
                <div
                  key={marketplace.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <MarketplaceLogo name={marketplace.name} className="h-10 w-10" />
                    <div>
                      <p className="font-medium">{marketplace.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {configured ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">API Configurada</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            <span>API não configurada</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={configured && config?.enabled ? 'default' : 'secondary'}>
                      {configured && config?.enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfigClick(marketplace)}
                      className="flex items-center gap-2"
                    >
                      <Settings2 className="h-4 w-4" />
                      Configurar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Configure como você deseja receber notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">Receber notificações por email</p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS</p>
              <p className="text-sm text-muted-foreground">Receber notificações por SMS</p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push</p>
              <p className="text-sm text-muted-foreground">Receber notificações push</p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>Detalhes da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Empresa</p>
            <p className="text-lg font-medium">D&A Naturals</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Website</p>
            <a
              href="https://www.deanaturals.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-primary hover:underline"
            >
              www.deanaturals.com.br
            </a>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Plano</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-lg font-medium">Premium</p>
              <Badge>Ativo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Configuração */}
      <MarketplaceConfigDialog
        marketplace={selectedMarketplace}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={selectedMarketplace ? configs[selectedMarketplace.id] : initialConfigs['1']}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
