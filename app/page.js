import Vitrine from './Vitrine.jsx';
import { listOffers } from '../lib/db.js';
import { SITE } from '../lib/site.js';

export const revalidate = 30; // a página é refeita no servidor, no máximo, a cada 30 segundos

export default async function Page() {
  const { offers, demo } = await listOffers();
  return <Vitrine initialOffers={offers} initialDemo={Boolean(demo)} site={SITE} />;
}
