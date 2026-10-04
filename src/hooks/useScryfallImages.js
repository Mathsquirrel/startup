import { useEffect, useState } from 'react';

export default function useScryfallImages(items, nameKey = 'cardName') {
  const [images, setImages] = useState({});
  const itemNames = items.map((item) => typeof item === 'string' ? item : item[nameKey]).join('|');

  useEffect(() => {
    let active = true;
    Promise.all(items.map(async (item) => {
      const name = typeof item === 'string' ? item : item[nameKey];
      try {
        const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
        if (!response.ok) return null;
        const card = await response.json();
        return [name, card.image_uris?.art_crop || card.image_uris?.normal];
      } catch { return null; }
    })).then((results) => { if (active) setImages(Object.fromEntries(results.filter(Boolean))); });
    return () => { active = false; };
  }, [itemNames, nameKey]);

  return images;
}