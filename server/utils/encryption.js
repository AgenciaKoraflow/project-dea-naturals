import crypto from "crypto";

// Chave de criptografia - em produção, deve vir de variável de ambiente segura
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const ALGORITHM = "aes-256-gcm";

/**
 * Deriva uma chave de 32 bytes a partir de uma string
 */
function deriveKey(password) {
  return crypto.scryptSync(password, "salt", 32);
}

/**
 * Criptografa um texto usando AES-256-GCM
 * @param {string} text - Texto a ser criptografado
 * @returns {string} - String no formato: iv:authTag:encryptedData (todos em base64)
 */
export function encrypt(text) {
  if (!text) return null;

  const key = deriveKey(ENCRYPTION_KEY);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Retorna iv:authTag:encryptedData (todos em hex, separados por :)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Descriptografa um texto criptografado usando AES-256-GCM
 * @param {string} encryptedText - Texto criptografado no formato: iv:authTag:encryptedData
 * @returns {string} - Texto descriptografado
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return null;

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format");
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const key = deriveKey(ENCRYPTION_KEY);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error.message);
    throw new Error("Failed to decrypt data");
  }
}
