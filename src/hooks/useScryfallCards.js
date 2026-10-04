import { useEffect, useState } from 'react';

export default function useScryfallCards(names) {
  const [cards, setCards] = useState({});
  const cardNames = names.join('|');

  useEffect(() => {
    let active = true;
    Promise.all(names.map(async (name) => {
      try {
        const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
        if (!response.ok) return null;
        return await response.json();
      } catch { return null; }
    })).then((results) => {
      if (active) setCards(Object.fromEntries(results.filter(Boolean).map((card) => [card.name, card])));
    });
    return () => { active = false; };
  }, [cardNames]);

  return cards;
}