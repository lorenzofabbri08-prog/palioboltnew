import type { Contrada } from '@/game/types';
import { CONTRADA_BY_ID } from '@/game/data';

const FLAG_IMAGES: Record<string, string> = {
  bruco: '/images/contrade/nobile_bruco.jpg',
  pantera: '/images/contrade/pantera.jpg',
  civetta: '/images/contrade/priora_civetta.jpg',
  selva: '/images/contrade/selva.jpg',
  torre: '/images/contrade/torre.jpg',
  montone: '/images/contrade/valdimontone.jpg',
  istrice: '/images/contrade/sovrana_istrice.jpg',
  tartuca: '/images/contrade/tartuca.jpg',
  onda: '/images/contrade/capitana_onda.jpg',
  chiocciola: '/images/contrade/chiocciola.jpg',
  drago: '/images/contrade/drago.jpg',
  nicchio: '/images/contrade/nobile_nicchio.jpg',
  oca: '/images/contrade/nobile_oca.jpg',
  lupa: '/images/contrade/lupa.jpg',
  aquila: '/images/contrade/nobile_aquila.jpg',
  giraffa: '/images/contrade/imperiale_giraffa.jpg',
  leocorno: '/images/contrade/leocorno.jpg',
};

export function ContradaFlag({ contradaId, size = 40, className = '' }: { contradaId: string; size?: number; className?: string }) {
  const contrada: Contrada | undefined = CONTRADA_BY_ID[contradaId];
  const imagePath = FLAG_IMAGES[contradaId];
  if (!contrada || !imagePath) return null;

  return (
    <img
      src={imagePath}
      alt={`Bandiera della ${contrada.name}`}
      width={size}
      height={size}
      className={`rounded-lg border border-white/20 object-cover shadow-md shadow-black/30 ${className}`}
      style={{ aspectRatio: '1 / 1' }}
    />
  );
}
