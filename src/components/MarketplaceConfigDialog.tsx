import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Check, X, ExternalLink } from "lucide-react";
import { Marketplace } from "@/lib/mockData";
import { MarketplaceLogo } from "@/components/MarketplaceLogo";
import { useMercadoLivreCredentials } from "@/hooks/useMercadoLivreCredentials";
import { useToast } from "@/hooks/use-toast";

export interface MarketplaceConfig {
  apiKey: string;
  apiSecret?: string;
  sellerId?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId: string;
  clientSecret: string;
  authorizationCode: string;
  redirectUri: string;
  storeUrl?: string;
  enabled: boolean;
}

interface MarketplaceConfigDialogProps {
  marketplace: Marketplace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: MarketplaceConfig;
  onSave: (config: MarketplaceConfig) => void;
}

// Campos específicos por marketplace
const marketplaceFields: Record<
  string,
  {
    label: string;
    key: keyof MarketplaceConfig;
    required: boolean;
    placeholder: string;
  }[]
> = {
  "Mercado Livre": [
    {
      label: "Client ID",
      key: "clientId",
      required: true,
      placeholder: "Ex: 1234567890123456",
    },
    {
      label: "Client Secret",
      key: "clientSecret",
      required: true,
      placeholder: "Sua chave secreta do ML",
    },
    {
      label: "URI de Redirecionamento",
      key: "redirectUri",
      required: true,
      placeholder: "https://seu-app.com/callback",
    },
  ],
};

const defaultConfig: MarketplaceConfig = {
  apiKey: "",
  apiSecret: "",
  sellerId: "",
  accessToken: "",
  refreshToken: "",
  clientId: "",
  clientSecret: "",
  redirectUri: "",
  authorizationCode: "",
  storeUrl: "",
  enabled: false,
};

export function MarketplaceConfigDialog({
  marketplace,
  open,
  onOpenChange,
  config,
  onSave,
}: MarketplaceConfigDialogProps) {
  const { credentials, saveCredentials, testConnection, isSaving, isTesting } =
    useMercadoLivreCredentials();
  const { toast } = useToast();
  const [formData, setFormData] = useState<MarketplaceConfig>(
    config || defaultConfig
  );
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null
  );
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [oauthStep, setOauthStep] = useState<"credentials" | "authorization">(
    "credentials"
  );

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

  // Carrega credenciais do banco quando o diálogo abre
  useEffect(() => {
    if (open && marketplace?.name === "Mercado Livre" && credentials) {
      setFormData((prev) => ({
        ...prev,
        clientId: credentials.client_id || prev.clientId,
        redirectUri: credentials.redirect_uri || prev.redirectUri,
        enabled: credentials.is_active || prev.enabled,
      }));
      setOauthStep(
        credentials.oauth_completed ? "credentials" : "authorization"
      );
    }
  }, [open, credentials, marketplace]);

  if (!marketplace) return null;

  const fields =
    marketplaceFields[marketplace.name] || marketplaceFields["Site Próprio"];

  const handleInputChange = (
    key: keyof MarketplaceConfig,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Gera URL de autorização do Mercado Livre
  const getAuthorizationUrl = () => {
    const clientId = formData.clientId;
    const redirectUri = encodeURIComponent(formData.redirectUri);
    return `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
  };

  const handleSaveCredentials = async () => {
    if (!formData.clientId || !formData.clientSecret || !formData.redirectUri) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveCredentials({
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        redirectUri: formData.redirectUri,
      });

      toast({
        title: "Sucesso",
        description: "Credenciais salvas com sucesso!",
      });

      setOauthStep("authorization");
      setTestResult(null);
      setShowSaveConfirm(false);
      onSave({ ...formData });
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: getErrorMessage(error, "Erro ao salvar credenciais"),
        variant: "destructive",
      });
    }
  };

  const confirmSaveCredentials = async () => {
    setShowSaveConfirm(true);
  };

  const handleContinueConfig = async () => {
    if (!formData.clientId || !formData.clientSecret || !formData.redirectUri) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveCredentials({
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        redirectUri: formData.redirectUri,
      });

      setOauthStep("authorization");
      setTestResult(null);
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: getErrorMessage(error, "Erro ao salvar credenciais"),
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    if (!formData.authorizationCode) {
      toast({
        title: "Erro",
        description: "Você precisa fornecer o código de autorização",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await testConnection(formData.authorizationCode);

      if (result.success) {
        setTestResult("success");
        toast({
          title: "Sucesso",
          description: "Conexão estabelecida com sucesso!",
        });
        setOauthStep("credentials");
        onSave({ ...formData, enabled: true });
        onOpenChange(false);
      } else {
        setTestResult("error");
        throw new Error(result.message || "Falha na conexão");
      }
    } catch (error: unknown) {
      setTestResult("error");
      toast({
        title: "Erro",
        description: getErrorMessage(
          error,
          "Falha na conexão. Verifique as credenciais."
        ),
        variant: "destructive",
      });
    }
  };

  const isSecretField = (key: string) => {
    return (
      key.toLowerCase().includes("secret") ||
      key.toLowerCase().includes("token") ||
      key === "apiKey"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <MarketplaceLogo name={marketplace.name} className="h-8 w-8" />
            Configurar {marketplace.name}
          </DialogTitle>
          <DialogDescription>
            Insira as credenciais de API para conectar ao {marketplace.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {oauthStep === "credentials" ? (
            <>
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label
                    htmlFor={field.key}
                    className="flex items-center gap-1"
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.key}
                      type={
                        isSecretField(field.key) && !showSecrets[field.key]
                          ? "password"
                          : "text"
                      }
                      placeholder={field.placeholder}
                      value={(formData[field.key] as string) || ""}
                      onChange={(e) =>
                        handleInputChange(field.key, e.target.value)
                      }
                      disabled={
                        credentials &&
                        (field.key === "clientId" ||
                          field.key === "redirectUri")
                      }
                      className="pr-10"
                    />
                    {isSecretField(field.key) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => toggleShowSecret(field.key)}
                      >
                        {showSecrets[field.key] ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Passo 1: Autorizar aplicativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Clique no botão abaixo para autorizar o acesso ao Mercado
                    Livre. Você será redirecionado para a página de autorização.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(getAuthorizationUrl(), "_blank")}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Autorizar no Mercado Livre
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorizationCode">
                    Passo 2: Cole o código de autorização
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Após autorizar, você receberá um código. Cole-o no campo
                    abaixo.
                  </p>
                  <Input
                    id="authorizationCode"
                    placeholder="Cole o código aqui"
                    value={formData.authorizationCode || ""}
                    onChange={(e) =>
                      handleInputChange("authorizationCode", e.target.value)
                    }
                  />
                </div>
              </div>
            </>
          )}

          {testResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult === "success"
                  ? "bg-green-500/10 text-green-600 border border-green-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {testResult === "success" ? (
                <>
                  <Check className="h-4 w-4" />
                  Conexão estabelecida com sucesso!
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Falha na conexão. Verifique as credenciais.
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {oauthStep === "credentials" ? (
            <>
              <Button
                onClick={handleContinueConfig}
                disabled={
                  isSaving ||
                  !formData.clientId ||
                  !formData.clientSecret ||
                  !formData.redirectUri
                }
                className="w-full sm:w-auto"
              >
                {isSaving ? "Salvando..." : "Continuar configuração"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setOauthStep("credentials")}
                className="w-full sm:w-auto"
              >
                Voltar
              </Button>
              <Button
                variant="outline"
                onClick={confirmSaveCredentials}
                disabled={
                  isSaving ||
                  !formData.clientId ||
                  !formData.clientSecret ||
                  !formData.redirectUri
                }
                className="w-full sm:w-auto"
              >
                {isSaving ? "Salvando..." : "Salvar Credenciais"}
              </Button>
              <Button
                onClick={handleTestConnection}
                disabled={
                  isTesting ||
                  !formData.authorizationCode ||
                  testResult === "success"
                }
                className="w-full sm:w-auto"
              >
                {isTesting ? "Testando..." : "Testar Conexão"}
              </Button>
            </>
          )}
        </DialogFooter>
        <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Salvar alterações?</AlertDialogTitle>
              <AlertDialogDescription>
                As alterações nas credenciais serão salvas. Você poderá
                continuar a configuração depois.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveCredentials}>
                Salvar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
