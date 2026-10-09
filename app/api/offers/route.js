import { listOffers } from '../../../lib/db.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await listOffers();
  return Response.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60' },
  });
}
