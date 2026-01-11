# Integração Mercado Livre - Documentação

## Visão Geral

Esta documentação descreve a implementação da integração com a API do Mercado Livre, incluindo armazenamento seguro de credenciais, fluxo OAuth e renovação automática de tokens.

## Recursos Implementados

### 1. Armazenamento Seguro de Credenciais

- **Tabela no Banco de Dados**: `mercado_livre_credentials`
  - Campos criptografados: `client_secret_encrypted`, `access_token_encrypted`, `refresh_token_encrypted`
  - Criptografia AES-256-GCM em repouso
  - Credenciais nunca expostas no frontend ou logs

### 2. Fluxo OAuth

- **Passo 1**: Salvar credenciais (Client ID, Client Secret, Redirect URI)
- **Passo 2**: Autorizar aplicativo no Mercado Livre
- **Passo 3**: Testar conexão com código de autorização
- Tokens gerados automaticamente e armazenados de forma segura

### 3. Renovação Automática de Tokens

- Job em background que verifica expiração de tokens a cada minuto
- Renovação automática 5 minutos antes do vencimento
- Atualização automática no banco de dados

### 4. Interface do Usuário

- Página de Configurações com integração Mercado Livre
- Diálogo de configuração com fluxo OAuth guiado
- Confirmação ao desativar integração
- Feedback visual de status (Ativo/Inativo)

## Configuração

### Variáveis de Ambiente Necessárias

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
# ou
SUPABASE_ANON_KEY=sua_anon_key

# Criptografia (importante para produção)
ENCRYPTION_KEY=sua_chave_de_criptografia_de_32_bytes

# Servidor
PORT=3000

# API URL para frontend
VITE_API_URL=http://localhost:3000
```

**IMPORTANTE**:

- A `ENCRYPTION_KEY` deve ser uma string segura e aleatória
- NUNCA compartilhe ou commite a `ENCRYPTION_KEY` no repositório
- Se a chave mudar, os dados criptografados não poderão ser descriptografados

## Endpoints da API

### POST `/api/mercadolibre/credentials`

Salva as credenciais do Mercado Livre no banco de dados.

**Body:**

```json
{
  "clientId": "seu_client_id",
  "clientSecret": "seu_client_secret",
  "redirectUri": "https://seu-app.com/callback"
}
```

### GET `/api/mercadolibre/credentials`

Retorna as credenciais configuradas (sem dados sensíveis).

### POST `/api/mercadolibre/test-connection`

Testa a conexão OAuth e gera tokens iniciais.

**Body:**

```json
{
  "authorizationCode": "código_de_autorização"
}
```

### PATCH `/api/mercadolibre/credentials/active`

Ativa ou desativa a integração.

**Body:**

```json
{
  "isActive": true
}
```

### POST `/api/mercadolibre/refresh`

Renova manualmente os tokens de acesso.

## Como Usar

### 1. Configurar Credenciais

1. Acesse a página de **Configurações**
2. Clique em **Configurar** no card do Mercado Livre
3. Preencha:
   - Client ID
   - Client Secret
   - URI de Redirecionamento
4. Clique em **Salvar Credenciais**

### 2. Autorizar Aplicativo

1. Após salvar as credenciais, clique em **Continuar para Autorização**
2. Clique no botão **Autorizar no Mercado Livre**
3. Você será redirecionado para a página de autorização do Mercado Livre
4. Autorize o aplicativo
5. Copie o código de autorização retornado
6. Cole o código no campo **Passo 2**
7. Clique em **Testar Conexão**

### 3. Ativar Integração

1. Após o teste bem-sucedido, você pode ativar a integração
2. Use o switch **Ativar Integração** no diálogo
3. Uma confirmação será solicitada ao desativar

## Segurança

- ✅ Criptografia AES-256-GCM em repouso
- ✅ Credenciais nunca expostas no frontend
- ✅ Logs não contêm informações sensíveis
- ✅ Tokens renovados automaticamente antes de expirar
- ✅ Row Level Security (RLS) habilitado no Supabase

## Estrutura do Banco de Dados

```sql
CREATE TABLE mercado_livre_credentials (
  id UUID PRIMARY KEY,
  client_id TEXT NOT NULL,
  client_secret_encrypted TEXT NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  redirect_uri TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  token_expires_at TIMESTAMPTZ,
  oauth_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Notas Importantes

1. **Testar Conexão**: Deve ser executado apenas uma vez após salvar as credenciais iniciais
2. **Renovação Automática**: Os tokens são renovados automaticamente pelo backend
3. **Desativar Integração**: Sempre solicita confirmação do usuário
4. **Criptografia**: A chave de criptografia deve ser mantida segura e consistente

## Troubleshooting

### Erro ao descriptografar dados

- Verifique se a `ENCRYPTION_KEY` está configurada corretamente
- A chave deve ser a mesma usada para criptografar os dados

### Erro ao conectar ao Supabase

- Verifique as variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
- Confirme que o serviço está ativo

### Token expirado

- Os tokens são renovados automaticamente
- Se persistir, verifique os logs do servidor
- Tente renovar manualmente via endpoint `/api/mercadolibre/refresh`
