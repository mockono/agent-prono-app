import { Redis } from "@upstash/redis";

/**
 * ⚠️ Jamais testé contre une vraie instance Upstash dans mon environnement
 * de génération (pas d'accès réseau, pas de base). Les noms de variables
 * d'environnement peuvent varier selon la façon dont l'intégration a été
 * connectée sur Vercel — je couvre les deux conventions les plus courantes
 * (KV_REST_API_* hérité de l'ancien "Vercel KV", et UPSTASH_REDIS_REST_*
 * pour une connexion Upstash directe). Si l'enregistrement ne fonctionne
 * pas, va dans Vercel → Storage → ta base → onglet ".env.local" pour voir
 * les noms exacts, et dis-les-moi.
 */

let client: Redis | null = null;

function getClient(): Redis | null {
  if (client) return client;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}

export type PredictionStatus = "pending" | "won" | "lost";

export interface StoredPrediction {
  id: string;
  matchId: string;
  competitionCode: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  market: string;
  selectionDetail: string;
  odds: number;
  confidenceScore: number;
  status: PredictionStatus;
  generatedAt: string;
  settledAt?: string;
}

const INDEX_KEY = "predictions:index";
const PREFIX = "prediction:";

function parseRecord(raw: unknown): StoredPrediction | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as StoredPrediction;
    } catch {
      return null;
    }
  }
  return raw as StoredPrediction;
}

export async function recordPredictionIfNew(
  pred: Omit<StoredPrediction, "status" | "generatedAt" | "settledAt">
): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  const key = `${PREFIX}${pred.id}`;
  const existing = await redis.get(key);
  if (existing) return;

  const record: StoredPrediction = { ...pred, status: "pending", generatedAt: new Date().toISOString() };
  await redis.set(key, record);
  await redis.lpush(INDEX_KEY, pred.id);
}

export async function listPredictions(limit = 300): Promise<StoredPrediction[]> {
  const redis = getClient();
  if (!redis) return [];

  const ids = await redis.lrange<string>(INDEX_KEY, 0, limit - 1);
  if (!ids.length) return [];

  const keys = ids.map((id) => `${PREFIX}${id}`);
  const raw = await redis.mget<unknown[]>(...keys);
  return raw.map(parseRecord).filter((r): r is StoredPrediction => r !== null);
}

export async function updatePredictionStatus(id: string, status: Exclude<PredictionStatus, "pending">): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  const key = `${PREFIX}${id}`;
  const raw = await redis.get(key);
  const record = parseRecord(raw);
  if (!record) return;

  record.status = status;
  record.settledAt = new Date().toISOString();
  await redis.set(key, record);
}