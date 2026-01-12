import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { encrypt, decrypt } from "./utils/encryption.js";
import { supabase } from "./utils/supabase.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Variáveis globais para armazenar tokens em memória (fallback)
let accessToken = null;
let refreshToken = null;

// Função para desativar credenciais no banco de dados
async function deactivateCredentials(credentialsId) {
  try {
    const { error } = await supabase
      .from("mercado_livre_credentials")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", credentialsId);

    if (error) {
      console.error("Erro ao desativar credenciais:", error);
    } else {
      console.log(
        `Credenciais ${credentialsId} desativadas automaticamente devido a falha na conexão`
      );
    }
  } catch (error) {
    console.error("Erro ao desativar credenciais:", error);
  }
}

// Função para obter credenciais do banco de dados
async function getCredentialsFromDB() {
  try {
    const { data, error } = await supabase
      .from("mercado_livre_credentials")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      client_id: data.client_id,
      client_secret: decrypt(data.client_secret_encrypted),
      access_token: data.access_token_encrypted
        ? decrypt(data.access_token_encrypted)
        : null,
      refresh_token: data.refresh_token_encrypted
        ? decrypt(data.refresh_token_encrypted)
        : null,
      redirect_uri: data.redirect_uri,
      token_expires_at: data.token_expires_at,
      oauth_completed: data.oauth_completed,
    };
  } catch (error) {
    console.error("Erro ao buscar credenciais:", error);
    return null;
  }
}

// Função para atualizar tokens no banco de dados
async function updateTokensInDB(
  credentialsId,
  accessToken,
  refreshToken,
  expiresIn = 21600
) {
  try {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn - 300); // Renovar 5 minutos antes do vencimento

    const { error } = await supabase
      .from("mercado_livre_credentials")
      .update({
        access_token_encrypted: encrypt(accessToken),
        refresh_token_encrypted: refreshToken
          ? encrypt(refreshToken)
          : undefined,
        token_expires_at: expiresAt.toISOString(),
        oauth_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", credentialsId);

    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Erro ao atualizar tokens no banco:", error);
    throw error;
  }
}

// Função para obter tokens iniciais usando o authorization code
async function getInitialTokens(
  clientId,
  clientSecret,
  redirectUri,
  authorizationCode
) {
  if (!clientId || !clientSecret || !redirectUri || !authorizationCode) {
    throw new Error("Missing required credentials");
  }

  try {
    const url = `https://api.mercadolibre.com/oauth/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${authorizationCode}&redirect_uri=${redirectUri}`;

    const response = await axios.post(url);

    if (response.status === 200 && response.data) {
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in || 21600,
        user_id: response.data.user_id,
      };
    }

    throw new Error("Failed to get tokens");
  } catch (error) {
    if (error.response) {
      console.error("Erro ao obter tokens:", error.response.data);
      throw new Error(
        `Failed to get tokens: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      );
    }
    throw error;
  }
}

// Função para renovar o access_token usando o refresh_token
async function refreshAccessToken(clientId, clientSecret, refreshTokenValue) {
  if (!clientId || !clientSecret || !refreshTokenValue) {
    throw new Error("Missing client credentials or refresh token");
  }

  try {
    const url = `https://api.mercadolibre.com/oauth/token?grant_type=refresh_token&client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshTokenValue}`;

    const response = await axios.post(url);

    if (response.status === 200 && response.data) {
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshTokenValue,
        expires_in: response.data.expires_in || 21600,
      };
    }

    throw new Error("Failed to refresh token");
  } catch (error) {
    if (error.response) {
      console.error("Erro ao renovar token:", error.response.data);
      throw new Error(
        `Failed to refresh token: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      );
    }
    throw error;
  }
}

// Função para obter e renovar token automaticamente se necessário
async function getValidAccessToken() {
  const credentials = await getCredentialsFromDB();
  if (!credentials) {
    throw new Error("No active credentials found");
  }

  // Verifica se o token expirou ou está próximo de expirar (5 minutos de margem)
  const now = new Date();
  const expiresAt = credentials.token_expires_at
    ? new Date(credentials.token_expires_at)
    : null;

  if (!expiresAt || now >= new Date(expiresAt.getTime() - 5 * 60 * 1000)) {
    // Token expirado ou próximo de expirar, renova
    console.log("Token expirado ou próximo de expirar. Renovando...");
    try {
      const tokens = await refreshAccessToken(
        credentials.client_id,
        credentials.client_secret,
        credentials.refresh_token
      );
      await updateTokensInDB(
        credentials.id,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in
      );
      return tokens.access_token;
    } catch (error) {
      // Se falhar ao renovar, desativa as credenciais
      console.error("Erro ao renovar token. Desativando credenciais:", error);
      await deactivateCredentials(credentials.id);
      throw error;
    }
  }

  return credentials.access_token;
}

// Função helper para fazer requisições com renovação automática em caso de 401
async function makeRequestWithAutoRefresh(url, config = {}) {
  let credentials = await getCredentialsFromDB();
  if (!credentials) {
    throw new Error("No active credentials found");
  }

  let token = await getValidAccessToken();

  // Adiciona o access_token no header Authorization
  const requestConfig = {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios.get(url, requestConfig);
    return response;
  } catch (error) {
    // Se receber 401 (não autorizado), renova o token e tenta novamente
    if (error.response && error.response.status === 401) {
      console.log("Token expirado. Renovando...");
      try {
        token = await getValidAccessToken();

        // Tenta novamente com o novo token
        const retryConfig = {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          },
        };

        try {
          const retryResponse = await axios.get(url, retryConfig);
          return retryResponse;
        } catch (retryError) {
          // Se após renovar ainda receber 401, as credenciais estão inválidas
          if (retryError.response && retryError.response.status === 401) {
            console.error(
              "Erro 401 persistente após renovar token. Desativando credenciais."
            );
            await deactivateCredentials(credentials.id);
          }
          throw retryError;
        }
      } catch (refreshError) {
        // Se falhar ao renovar, desativa as credenciais
        console.error(
          "Erro ao renovar token após 401. Desativando credenciais:",
          refreshError
        );
        await deactivateCredentials(credentials.id);
        throw refreshError;
      }
    }
    throw error;
  }
}

// ===== NOVOS ENDPOINTS PARA GERENCIAR CREDENCIAIS =====

// Endpoint para salvar credenciais do Mercado Livre
app.post("/api/mercadolibre/credentials", async (req, res) => {
  try {
    const { clientId, clientSecret, redirectUri } = req.body;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({
        message: "Client ID, Client Secret e Redirect URI são obrigatórios",
      });
    }

    // Desativa outras credenciais ativas
    await supabase
      .from("mercado_livre_credentials")
      .update({ is_active: false })
      .eq("is_active", true);

    // Insere nova credencial
    const { data, error } = await supabase
      .from("mercado_livre_credentials")
      .insert({
        client_id: clientId,
        client_secret_encrypted: encrypt(clientSecret),
        redirect_uri: redirectUri,
        is_active: false, // Não ativa até completar OAuth
        oauth_completed: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: "Credenciais salvas com sucesso",
      id: data.id,
    });
  } catch (error) {
    console.error("Erro ao salvar credenciais:", error);
    res.status(500).json({
      message: "Erro ao salvar credenciais",
      error: error.message,
    });
  }
});

// Endpoint para obter credenciais (sem tokens sensíveis)
app.get("/api/mercadolibre/credentials", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("mercado_livre_credentials")
      .select(
        "id, client_id, redirect_uri, is_active, oauth_completed, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.json(null);
    }

    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar credenciais:", error);
    res.status(500).json({
      message: "Erro ao buscar credenciais",
      error: error.message,
    });
  }
});

// Endpoint para testar conexão (OAuth inicial)
app.post("/api/mercadolibre/test-connection", async (req, res) => {
  try {
    const { authorizationCode } = req.body;

    if (!authorizationCode) {
      return res.status(400).json({
        success: false,
        message: "Authorization code é obrigatório",
      });
    }

    // Busca credenciais do banco (ativas ou inativas)
    let credentials = await getCredentialsFromDB();
    let credentialId = null;
    let clientId = null;
    let clientSecret = null;
    let redirectUri = null;

    if (!credentials) {
      // Se não houver credenciais ativas, busca qualquer credencial recente
      const { data, error } = await supabase
        .from("mercado_livre_credentials")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          message:
            "Credenciais não encontradas. Configure as credenciais primeiro.",
        });
      }

      credentialId = data.id;
      clientId = data.client_id;
      clientSecret = decrypt(data.client_secret_encrypted);
      redirectUri = data.redirect_uri;
    } else {
      credentialId = credentials.id;
      clientId = credentials.client_id;
      clientSecret = credentials.client_secret;
      redirectUri = credentials.redirect_uri;
    }

    // Obtém tokens iniciais usando o authorization code
    const tokens = await getInitialTokens(
      clientId,
      clientSecret,
      redirectUri,
      authorizationCode
    );

    // Atualiza com os tokens
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in - 300);

    const { error: updateError } = await supabase
      .from("mercado_livre_credentials")
      .update({
        access_token_encrypted: encrypt(tokens.access_token),
        refresh_token_encrypted: encrypt(tokens.refresh_token),
        token_expires_at: expiresAt.toISOString(),
        oauth_completed: true,
        is_active: true, // Ativa ao completar OAuth
        updated_at: new Date().toISOString(),
      })
      .eq("id", credentialId);

    if (updateError) {
      throw updateError;
    }

    // Verifica se a conexão está funcionando
    try {
      const testResponse = await axios.get(
        "https://api.mercadolibre.com/users/me",
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );

      res.json({
        success: true,
        message: "Conexão estabelecida com sucesso!",
        user_id: testResponse.data.id,
      });
    } catch (testError) {
      console.error("Erro ao verificar conexão:", testError);
      throw new Error("Falha ao verificar conexão com a API do Mercado Livre");
    }
  } catch (error) {
    console.error("Erro ao testar conexão:", error);
    res.status(400).json({
      success: false,
      message: "Falha na conexão",
      error: error.message,
    });
  }
});

// Endpoint para ativar/desativar integração
app.patch("/api/mercadolibre/credentials/active", async (req, res) => {
  try {
    const { isActive } = req.body;

    const { data, error } = await supabase
      .from("mercado_livre_credentials")
      .update({ is_active: isActive })
      .eq("is_active", !isActive)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: isActive ? "Integração ativada" : "Integração desativada",
      is_active: isActive,
    });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    res.status(500).json({
      message: "Erro ao atualizar status",
      error: error.message,
    });
  }
});

// Endpoint para renovar tokens manualmente
app.post("/api/mercadolibre/refresh", async (req, res) => {
  try {
    const credentials = await getCredentialsFromDB();
    if (!credentials) {
      return res.status(404).json({
        message: "Credenciais não encontradas",
      });
    }

    try {
      const tokens = await refreshAccessToken(
        credentials.client_id,
        credentials.client_secret,
        credentials.refresh_token
      );

      await updateTokensInDB(
        credentials.id,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in
      );

      res.json({
        message: "Token renovado com sucesso!",
      });
    } catch (refreshError) {
      // Se falhar ao renovar, desativa as credenciais
      console.error(
        "Erro ao renovar token. Desativando credenciais:",
        refreshError
      );
      await deactivateCredentials(credentials.id);
      throw refreshError;
    }
  } catch (error) {
    res.status(400).json({
      message: "Erro ao renovar token",
      error: error.message,
    });
  }
});

// Endpoint para verificar status dos tokens
app.get("/api/mercadolibre/status", (req, res) => {
  res.json({
    has_access_token: !!accessToken,
    has_refresh_token: !!refreshToken,
    access_token: accessToken ? `${accessToken.substring(0, 20)}...` : null,
  });
});

// Exemplo de endpoint que usa o token com renovação automática
app.get("/api/mercadolibre/me", async (req, res) => {
  try {
    const response = await makeRequestWithAutoRefresh(
      "https://api.mercadolibre.com/users/me"
    );
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({
        message: "Erro ao buscar dados do usuário",
        error: error.response.data,
      });
    } else {
      res.status(500).json({
        message: "Erro ao buscar dados do usuário",
        error: error.message,
      });
    }
  }
});

app.get("/api/mercadolibre/orders", async (req, res) => {
  try {
    // Primeiro, obtém os dados do usuário para pegar o seller_id
    const userResponse = await makeRequestWithAutoRefresh(
      "https://api.mercadolibre.com/users/me"
    );
    const sellerId = userResponse.data.id;

    // Parâmetros opcionais da query string
    const orderStatus = req.query.status || ""; // Ex: "paid", "confirmed", "payment_required"
    const sort = req.query.sort || "date_desc"; // Ex: "date_desc", "date_asc"
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;

    // Constrói a URL com os parâmetros
    let ordersUrl = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&limit=${limit}&offset=${offset}&sort=${sort}`;

    if (orderStatus) {
      ordersUrl += `&order.status=${orderStatus}`;
    }

    // Busca os pedidos
    const ordersResponse = await makeRequestWithAutoRefresh(ordersUrl);

    res.json({
      seller_id: sellerId,
      orders: ordersResponse.data,
    });
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({
        message: "Erro ao buscar pedidos",
        error: error.response.data,
      });
    } else {
      res.status(500).json({
        message: "Erro ao buscar pedidos",
        error: error.message,
      });
    }
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
  });
});

// Job para renovar tokens automaticamente antes de expirar
setInterval(async () => {
  try {
    const credentials = await getCredentialsFromDB();
    if (!credentials || !credentials.token_expires_at) {
      return;
    }

    const now = new Date();
    const expiresAt = new Date(credentials.token_expires_at);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000;

    // Renova se estiver próximo de expirar (5 minutos de margem)
    if (timeUntilExpiry > 0 && timeUntilExpiry < fiveMinutes) {
      console.log("Automatically renewing token....");
      try {
        await getValidAccessToken();
        console.log("Token successfully renewed!");
      } catch (renewalError) {
        // getValidAccessToken já desativa as credenciais em caso de erro
        console.error("Error in automatic renewal job:", renewalError.message);
      }
    }
  } catch (error) {
    console.error("Error in automatic renewal job:", error.message);
  }
}, 60 * 1000); // Verifica a cada minuto

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("Automatic token renewal job started.");
});
