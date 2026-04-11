export const config = { runtime: 'nodejs18.x' };

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url:   process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, text, qualityScore, genre } = req.body || {};
  if (!userId || !text) return res.status(400).json({ error: 'Missing fields' });

  const seed = {
    id:               'S-' + Math.random().toString(36).slice(2,8).toUpperCase(),
    anchor:           'Pandora_Ch10_n3',
    logic_hash:       'sha256:' + Buffer.from(text.slice(0,50)).toString('base64'),
    entropy_pool:     Buffer.from(text.slice(0,30) + Date.now()).toString('base64').slice(0,64),
    compressionRatio: 0.62,
    qualityScore:     qualityScore || 0,
    genre:            genre || 'OTHER',
    owner:            userId,
    createdAt:        new Date().toISOString(),
  };

  await redis.hset(`jule:seed:${seed.id}`, seed);
  await redis.lpush(`jule:user:${userId}:seeds`, seed.id);

  return res.status(200).json({ seed });
}
