import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { marketplaces, Marketplace } from "@/lib/mockData";
import { useState } from "react";
import { Settings2, CheckCircle2, XCircle } from "lucide-react";
import {
  MarketplaceConfigDialog,
  MarketplaceConfig,
} from "@/components/MarketplaceConfigDialog";
import { MarketplaceLogo } from "@/components/MarketplaceLogo";
import { useMercadoLivreCredentials } from "@/hooks/useMercadoLivreCredentials";
import { useToast } from "@/hooks/use-toast";

// Estado inicial das configurações de cada marketplace
const initialConfigs: Record<string, MarketplaceConfig> = {
  "1": {
    apiKey: "",
    clientId: "",
    clientSecret: "",
    accessToken: "",
    refreshToken: "",
    sellerId: "",
    authorizationCode: "",
    redirectUri: "",
    enabled: false,
  },
  "2": {
    apiKey: "",
    apiSecret: "",
    sellerId: "",
    refreshToken: "",
    clientId: "",
    clientSecret: "",
    authorizationCode: "",
    redirectUri: "",
    enabled: false,
  },
  "3": {
    apiKey: "",
    clientId: "",
    sellerId: "",
    accessToken: "",
    refreshToken: "",
    clientSecret: "",
    authorizationCode: "",
    redirectUri: "",
    enabled: false,
  },
  "4": {
    apiKey: "",
    apiSecret: "",
    sellerId: "",
    accessToken: "",
    clientId: "",
    clientSecret: "",
    authorizationCode: "",
    redirectUri: "",
    enabled: false,
  },
  "5": {
    apiKey: "",
    apiSecret: "",
    storeUrl: "",
    clientId: "",
    clientSecret: "",
    authorizationCode: "",
    redirectUri: "",
    enabled: false,
  },
};

export default function Settings() {
  const { credentials, toggleActive, isToggling } =
    useMercadoLivreCredentials();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const [selectedMarketplace, setSelectedMarketplace] =
    useState<Marketplace | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configs, setConfigs] =
    useState<Record<string, MarketplaceConfig>>(initialConfigs);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const handleConfigClick = (marketplace: Marketplace) => {
    setSelectedMarketplace(marketplace);
    setDialogOpen(true);
  };

  const handleSaveConfig = (config: MarketplaceConfig) => {
    if (selectedMarketplace) {
      setConfigs((prev) => ({
        ...prev,
        [selectedMarketplace.id]: config,
      }));
    }
  };

  const isConfigured = (marketplaceId: string) => {
    // Para Mercado Livre, verifica se há credenciais no banco
    if (marketplaceId === "1" && credentials) {
      return credentials.oauth_completed;
    }

    // Para outros marketplaces, usa a lógica antiga
    const config = configs[marketplaceId];
    return config && config.apiKey && config.enabled;
  };

  const isActive = (marketplaceId: string) => {
    if (marketplaceId === "1" && credentials) {
      return credentials.is_active;
    }

    const config = configs[marketplaceId];
    return config?.enabled || false;
  };

  // Função helper para extrair mensagem de erro do axios
  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response &&
      error.response.data &&
      typeof error.response.data === "object" &&
      "message" in error.response.data &&
      typeof error.response.data.message === "string"
    ) {
      return error.response.data.message;
    }
    return defaultMessage;
  };

  const handleToggleActive = async (checked: boolean) => {
    if (!checked) {
      setShowDeactivateConfirm(true);
      return;
    }

    try {
      await toggleActive(true);
      toast({
        title: "Sucesso",
        description: "Integração ativada",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: getErrorMessage(error, "Erro ao ativar integração"),
        variant: "destructive",
      });
    }
  };

  const confirmDeactivate = async () => {
    try {
      await toggleActive(false);
      setShowDeactivateConfirm(false);
      toast({
        title: "Sucesso",
        description: "Integração desativada",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: getErrorMessage(error, "Erro ao desativar integração"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas integrações e preferências
        </p>
      </div>

      {/* Marketplaces */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplaces Conectados</CardTitle>
          <CardDescription>
            Clique em "Configurar" para adicionar as credenciais de API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketplaces
              .filter((m) => m.name === "Mercado Livre")
              .map((marketplace) => {
                const configured = isConfigured(marketplace.id);
                const active = isActive(marketplace.id);

                return (
                  <div
                    key={marketplace.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <MarketplaceLogo
                        name={marketplace.name}
                        className="h-10 w-10"
                      />
                      <div>
                        <p className="font-medium">{marketplace.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {configured ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">
                                API Configurada
                              </span>
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
                      {/* Inserir um check de ativação indicando a ativação ou desativação da integração. Deverá ficar desabilitado caso a integração não tenha sido configurada. Diálogo de confirmação para desativar com informativo de que será necessário os passos de configuração novamente se quiser reativar a integração */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {active ? "Ativo" : "Inativo"}
                        </span>
                        <Switch
                          checked={active}
                          onCheckedChange={handleToggleActive}
                          disabled={!configured || isToggling}
                        />
                      </div>
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
          <CardDescription>
            Configure como você deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                Receber notificações por email
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, email: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS</p>
              <p className="text-sm text-muted-foreground">
                Receber notificações por SMS
              </p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, sms: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push</p>
              <p className="text-sm text-muted-foreground">
                Receber notificações push
              </p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, push: checked })
              }
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
        config={
          selectedMarketplace
            ? configs[selectedMarketplace.id]
            : initialConfigs["1"]
        }
        onSave={handleSaveConfig}
      />

      {/* Dialog de Confirmação de Desativação */}
      <AlertDialog open={showDeactivateConfirm} onOpenChange={setShowDeactivateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar integração?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao desativar a integração, você precisará realizar os passos de
              configuração novamente se quiser reativá-la no futuro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate}>
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
