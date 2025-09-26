import { AuthContext } from '@pinubi/types';
import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/https';
import { admin, db, storage } from '../config/firebase';


export function generateUniqueCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}


/**
 * Gera timestamp atual - funciona tanto no emulador quanto em produção
 */
export function serverTimestamp() {
  return new Date().toISOString();
}

/**
 * Helper para incrementar valores - alternativa ao FieldValue.increment() que tem problemas no emulador
 */
export async function incrementField(docRef: admin.firestore.DocumentReference, field: string, value: number) {
  const doc = await docRef.get();
  const currentValue = doc.data()?.[field] || 0;
  return currentValue + value;
}

// ======================
// VALIDAÇÕES
// ======================

/**
 * Valida se o email tem formato válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida se a senha atende aos critérios mínimos
 */
export function isValidPassword(password: string): boolean {
  return password && password.length >= 6;
}

/**
 * Valida se o nome de usuário é válido
 */
export function isValidDisplayName(displayName: string): boolean {
  return displayName && displayName.trim().length >= 2 && displayName.trim().length <= 50;
}

// ======================
// VERIFICAÇÕES DE PERMISSÃO
// ======================

/**
 * Verifica se o usuário está autenticado
 */
export function requireAuth(auth: AuthContext | undefined): AuthContext {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }
  return auth;
}

/**
 * Verifica se o usuário é admin
 */
export async function requireAdmin(auth: AuthContext | undefined): Promise<AuthContext> {
  const authContext = requireAuth(auth);

  try {
    const userDoc = await db.collection('users').doc(authContext.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Acesso negado - apenas administradores');
    }

    return authContext;
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error('Erro ao verificar permissões de admin:', error);
    throw new HttpsError('internal', 'Erro interno ao verificar permissões');
  }
}

/**
 * Verifica se o usuário pode acessar os dados de outro usuário
 */
export async function canAccessUserData(auth: AuthContext | undefined, targetUserId: string): Promise<boolean> {
  const authContext = requireAuth(auth);

  // O usuário pode sempre acessar seus próprios dados
  if (authContext.uid === targetUserId) {
    return true;
  }

  // Verificar se é admin
  try {
    const userDoc = await db.collection('users').doc(authContext.uid).get();
    const userData = userDoc.data();

    return userData?.role === 'admin';
  } catch (error) {
    logger.error('Erro ao verificar permissões de acesso:', error);
    return false;
  }
}

// ======================
// UTILITÁRIOS DE DADOS
// ======================

/**
 * Sanitiza dados de usuário para resposta pública
 */
export function sanitizeUserData(userData: any): any {
  if (!userData) return null;

  const {
    password,
    fcmToken,
    fcmTokenUpdatedAt,
    ...publicData
  } = userData;

  return publicData;
}

/**
 * Sanitiza lista de usuários para resposta pública
 */
export function sanitizeUsersData(users: any[]): any[] {
  return users.map(user => sanitizeUserData(user));
}

/**
 * Cria um ID único baseado em timestamp
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formata data para string legível
 */
export function formatDate(date: Date | any): string {
  if (!date) return '';

  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ======================
// UTILITÁRIOS DE ERROR HANDLING
// ======================

/**
 * Converte erro genérico em HttpsError
 */
export function handleError(error: any, defaultMessage: string = 'Erro interno'): HttpsError {
  if (error instanceof HttpsError) {
    return error;
  }

  logger.error(defaultMessage, error);

  // Verificar tipos específicos de erro do Firebase
  if (error?.code) {
    switch (error.code) {
      case 'auth/user-not-found':
        return new HttpsError('not-found', 'Usuário não encontrado');
      case 'auth/email-already-exists':
        return new HttpsError('already-exists', 'Email já está em uso');
      case 'auth/invalid-email':
        return new HttpsError('invalid-argument', 'Email inválido');
      case 'auth/weak-password':
        return new HttpsError('invalid-argument', 'Senha muito fraca');
      default:
        return new HttpsError('internal', defaultMessage);
    }
  }

  return new HttpsError('internal', defaultMessage);
}

// ======================
// UTILITÁRIOS DE BATCH OPERATIONS
// ======================

/**
 * Executa operações em lote com controle de tamanho
 */
export async function executeBatch<T>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<void>
): Promise<void> {
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await operation(batch);
  }
}

// ======================
// UTILITÁRIOS DE CACHE
// ======================

/**
 * Cache simples em memória para dados temporários
 */
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();

// ======================
// UTILITÁRIOS DE RATE LIMITING
// ======================

/**
 * Rate limiting simples baseado em IP/usuário
 */
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  isAllowed(key: string, maxRequests: number = 60, windowSeconds: number = 60): boolean {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Limpar rate limiter a cada 5 minutos
setInterval(() => {
  rateLimiter.cleanup();
  cache.clear();
}, 5 * 60 * 1000);

// ======================
// UTILITÁRIOS DE VALIDAÇÃO DE DADOS
// ======================

/**
 * Valida dados de entrada usando schema simples
 */
export function validateInput(data: any, schema: Record<string, any>): void {
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    if (rules.required && (value === undefined || value === null || value === '')) {
      throw new HttpsError('invalid-argument', `Campo '${field}' é obrigatório`);
    }

    if (value !== undefined && value !== null) {
      if (rules.type === 'string' && typeof value !== 'string') {
        throw new HttpsError('invalid-argument', `Campo '${field}' deve ser uma string`);
      }

      if (rules.type === 'number' && typeof value !== 'number') {
        throw new HttpsError('invalid-argument', `Campo '${field}' deve ser um número`);
      }

      if (rules.type === 'email' && !isValidEmail(value)) {
        throw new HttpsError('invalid-argument', `Campo '${field}' deve ser um email válido`);
      }

      if (rules.minLength && value.length < rules.minLength) {
        throw new HttpsError('invalid-argument', `Campo '${field}' deve ter pelo menos ${rules.minLength} caracteres`);
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        throw new HttpsError('invalid-argument', `Campo '${field}' deve ter no máximo ${rules.maxLength} caracteres`);
      }
    }
  }
}

interface ReviewPhotoInput {
  base64: string;
  fileName: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

/**
 * Processa upload das fotos
 */
export async function processReviewPhotos(
  photos: ReviewPhotoInput[],
  userId: string,
  placeId: string
): Promise<string[]> {
  if (!photos || photos.length === 0) return [];

  // Limitar número de fotos
  if (photos.length > 5) {
    throw new HttpsError('invalid-argument', 'Máximo 5 fotos por review');
  }

  const uploadPromises = photos.map(async (photoData, index) => {
    // Validar dados da foto
    if (!photoData.base64 || !photoData.fileName) {
      throw new HttpsError('invalid-argument', 'Dados da foto incompletos');
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `reviews/${placeId}/${userId}/${timestamp}_${index}_${photoData.fileName}`;
    
    // Converter base64 para buffer
    const base64Data = photoData.base64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Validar tamanho da imagem (máximo 5MB)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      throw new HttpsError('invalid-argument', 'Imagem muito grande. Máximo 5MB.');
    }

    // Upload para Firebase Storage
    const file = storage.bucket().file(fileName);
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: photoData.mimeType || 'image/jpeg',
        metadata: {
          uploadedBy: userId,
          placeId: placeId,
          originalName: photoData.fileName,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Tornar arquivo público
    await file.makePublic();

    // Gerar URL
    const publicUrl = `https://storage.googleapis.com/${storage.bucket().name}/${fileName}`;
    
    return publicUrl;
    // return {
    //   url: publicUrl,
    //   fileName: fileName,
    //   size: imageBuffer.length,
    //   width: photoData.width || 0,
    //   height: photoData.height || 0
    // };
  });

  return await Promise.all(uploadPromises);
}

/**
 * Limpa dados para serem salvos no Firestore (remove undefined/null)
 */
export function cleanDataForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanDataForFirestore(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanDataForFirestore(value);
      }
    }
    return cleaned;
  }

  return obj;
}
