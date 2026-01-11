import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Variáveis globais para armazenar tokens em memória
let accessToken = null;
let refreshToken = null;

// Variáveis de ambiente do .env
const CLIENT_ID = process.env.ML_CLIENT_ID;
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const REDIRECT_URI = process.env.ML_REDIRECT_URI;
const AUTHORIZATION_CODE = process.env.ML_AUTHORIZATION_CODE;
const REFRESH_TOKEN_FROM_ENV = process.env.ML_REFRESH_TOKEN;

// Função para obter tokens iniciais usando o authorization code
async function getInitialTokens() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !AUTHORIZATION_CODE) {
    throw new Error("Missing required environment variables");
  }

  try {
    const url = `https://api.mercadolibre.com/oauth/token?grant_type=authorization_code&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${AUTHORIZATION_CODE}&redirect_uri=${REDIRECT_URI}`;

    const response = await axios.post(url);

    if (response.status === 200 && response.data) {
      accessToken = response.data.access_token;
      refreshToken = response.data.refresh_token;
      console.log("Tokens obtidos com sucesso!");
      return { access_token: accessToken, refresh_token: refreshToken };
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
async function refreshAccessToken() {
  if (!CLIENT_ID || !CLIENT_SECRET || !refreshToken) {
    throw new Error("Missing client credentials or refresh token");
  }

  try {
    const url = `https://api.mercadolibre.com/oauth/token?grant_type=refresh_token&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&refresh_token=${refreshToken}`;

    const response = await axios.post(url);

    if (response.status === 200 && response.data) {
      accessToken = response.data.access_token;
      // O refresh_token pode ser atualizado também
      if (response.data.refresh_token) {
        refreshToken = response.data.refresh_token;
      }
      console.log("Token renovado com sucesso!");
      return { access_token: accessToken, refresh_token: refreshToken };
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

// Função helper para fazer requisições com renovação automática em caso de 401
async function makeRequestWithAutoRefresh(url, config = {}) {
  if (!accessToken) {
    throw new Error(
      "No access token available. Please initialize tokens first."
    );
  }

  // Adiciona o access_token no header Authorization
  const requestConfig = {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  try {
    const response = await axios.get(url, requestConfig);
    return response;
  } catch (error) {
    // Se receber 401 (não autorizado), renova o token e tenta novamente
    if (error.response && error.response.status === 401) {
      console.log("Token expirado. Renovando...");
      await refreshAccessToken();

      // Tenta novamente com o novo token
      const retryConfig = {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      };

      const retryResponse = await axios.get(url, retryConfig);
      return retryResponse;
    }
    throw error;
  }
}

// Endpoint para inicializar tokens (usar apenas uma vez)
app.get("/api/mercadolibre/init", async (req, res) => {
  try {
    const tokens = await getInitialTokens();
    res.json({
      message: "Tokens obtidos e armazenados em memória com sucesso!",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
  } catch (error) {
    res.status(400).json({
      message: "Erro ao obter tokens",
      error: error.message,
    });
  }
});

// Endpoint para renovar tokens manualmente
app.get("/api/mercadolibre/refresh", async (req, res) => {
  try {
    const tokens = await refreshAccessToken();
    res.json({
      message: "Token renovado com sucesso!",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
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

// Exemplo de endpoint
app.get("/api/users", async (req, res) => {
  try {
    const response = await axios.get(
      "https://jsonplaceholder.typicode.com/users"
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar dados" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Tenta obter tokens automaticamente usando refresh_token do .env (se disponível)
  if (REFRESH_TOKEN_FROM_ENV && CLIENT_ID && CLIENT_SECRET) {
    console.log("Usando refresh_token do .env para obter tokens...");
    refreshToken = REFRESH_TOKEN_FROM_ENV;
    refreshAccessToken()
      .then(() => {
        console.log("Tokens obtidos automaticamente usando refresh_token!");
      })
      .catch((error) => {
        console.log(
          "Não foi possível obter tokens usando refresh_token:",
          error.message
        );
        console.log(
          "Use o endpoint GET /api/mercadolibre/init para obter tokens usando o authorization code"
        );
      });
  } else {
    console.log(
      "Refresh token não encontrado no .env. Use o endpoint GET /api/mercadolibre/init para obter tokens pela primeira vez"
    );
    console.log(
      "Após obter os tokens, salve o refresh_token no .env como ML_REFRESH_TOKEN para uso automático nas próximas vezes"
    );
  }
});
