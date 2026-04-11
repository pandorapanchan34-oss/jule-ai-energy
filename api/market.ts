import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url:   process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // 出品一覧取得
    const ids = await redis.lrange('jule:market:listings', 0, 49);
    if (ids.length === 0) return res.status(200).json({ listings: [] });

    const listings = await Promise.all(
      ids.map(id => redis.hgetall(`jule:listing:${id}`))
    );

    return res.status(200).json({
      listings: listings.filter(Boolean)
    });
  }

  if (req.method === 'POST') {
    // 出品
    const { userId, seedId, price } = req.body;
    if (!userId || !seedId || !price) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const seed = await redis.hgetall(`jule:seed:${seedId}`);
    if (!seed) return res.status(404).json({ error: 'Seed not found' });

    const listingId = 'L-' + Date.now();
    const listing = { id: listingId, seedId, seed, price, seller: userId };

    await redis.hset(`jule:listing:${listingId}`, listing);
    await redis.lpush('jule:market:listings', listingId);
    await redis.lrem(`jule:user:${userId}:seeds`, 0, seedId);

    return res.status(200).json({ listing });
  }

  return res.status(405).end();
}
