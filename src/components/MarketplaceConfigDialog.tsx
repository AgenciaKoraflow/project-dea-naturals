import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Marketplace } from '@/lib/mockData';
import { MarketplaceLogo } from '@/components/MarketplaceLogo';

export interface MarketplaceConfig {
  apiKey: string;
  apiSecret?: string;
  sellerId?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
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
const marketplaceFields: Record<string, { label: string; key: keyof MarketplaceConfig; required: boolean; placeholder: string }[]> = {
  'Mercado Livre': [
    { label: 'Client ID', key: 'clientId', required: true, placeholder: 'Ex: 1234567890123456' },
    { label: 'Client Secret', key: 'clientSecret', required: true, placeholder: 'Sua chave secreta do ML' },
    { label: 'Access Token', key: 'accessToken', required: true, placeholder: 'Token de acesso OAuth' },
    { label: 'Refresh Token', key: 'refreshToken', required: false, placeholder: 'Token para renovação automática' },
    { label: 'Seller ID', key: 'sellerId', required: true, placeholder: 'Ex: 123456789' },
  ],
  'Amazon': [
    { label: 'Seller ID', key: 'sellerId', required: true, placeholder: 'ID do vendedor Amazon' },
    { label: 'MWS Access Key', key: 'apiKey', required: true, placeholder: 'Chave de acesso MWS' },
    { label: 'MWS Secret Key', key: 'apiSecret', required: true, placeholder: 'Chave secreta MWS' },
    { label: 'Refresh Token (SP-API)', key: 'refreshToken', required: true, placeholder: 'Token LWA Refresh' },
    { label: 'Client ID (SP-API)', key: 'clientId', required: true, placeholder: 'ID do aplicativo SP-API' },
    { label: 'Client Secret (SP-API)', key: 'clientSecret', required: true, placeholder: 'Segredo do aplicativo SP-API' },
  ],
  'Shopee': [
    { label: 'Partner ID', key: 'clientId', required: true, placeholder: 'ID do parceiro Shopee' },
    { label: 'Partner Key', key: 'apiKey', required: true, placeholder: 'Chave de parceiro' },
    { label: 'Shop ID', key: 'sellerId', required: true, placeholder: 'ID da sua loja' },
    { label: 'Access Token', key: 'accessToken', required: true, placeholder: 'Token de acesso' },
    { label: 'Refresh Token', key: 'refreshToken', required: false, placeholder: 'Token de renovação' },
  ],
  'Magalu': [
    { label: 'API Key', key: 'apiKey', required: true, placeholder: 'Chave de API do Marketplace' },
    { label: 'API Secret', key: 'apiSecret', required: true, placeholder: 'Segredo da API' },
    { label: 'Seller ID', key: 'sellerId', required: true, placeholder: 'ID do seller no Magalu' },
    { label: 'Access Token', key: 'accessToken', required: false, placeholder: 'Token de autenticação' },
  ],
  'Site Próprio': [
    { label: 'URL da Loja', key: 'storeUrl', required: true, placeholder: 'https://sualoja.com.br' },
    { label: 'API Key', key: 'apiKey', required: true, placeholder: 'Chave de API da sua loja' },
    { label: 'API Secret', key: 'apiSecret', required: false, placeholder: 'Segredo da API (se aplicável)' },
  ],
};

const defaultConfig: MarketplaceConfig = {
  apiKey: '',
  apiSecret: '',
  sellerId: '',
  accessToken: '',
  refreshToken: '',
  clientId: '',
  clientSecret: '',
  storeUrl: '',
  enabled: false,
};

export function MarketplaceConfigDialog({
  marketplace,
  open,
  onOpenChange,
  config,
  onSave,
}: MarketplaceConfigDialogProps) {
  const [formData, setFormData] = useState<MarketplaceConfig>(config || defaultConfig);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  if (!marketplace) return null;

  const fields = marketplaceFields[marketplace.name] || marketplaceFields['Site Próprio'];

  const handleInputChange = (key: keyof MarketplaceConfig, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    // Simulação de teste de conexão
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simular sucesso se todos os campos obrigatórios estiverem preenchidos
    const requiredFields = fields.filter(f => f.required);
    const allFilled = requiredFields.every(f => formData[f.key]);
    
    setTestResult(allFilled ? 'success' : 'error');
    setIsTesting(false);
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const isSecretField = (key: string) => {
    return key.toLowerCase().includes('secret') || 
           key.toLowerCase().includes('token') || 
           key === 'apiKey';
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
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key} className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id={field.key}
                  type={isSecretField(field.key) && !showSecrets[field.key] ? 'password' : 'text'}
                  placeholder={field.placeholder}
                  value={(formData[field.key] as string) || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
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

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label>Ativar Integração</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar sincronização automática
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => handleInputChange('enabled', checked)}
            />
          </div>

          {testResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult === 'success'
                  ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
            >
              {testResult === 'success' ? (
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
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full sm:w-auto"
          >
            {isTesting ? 'Testando...' : 'Testar Conexão'}
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}