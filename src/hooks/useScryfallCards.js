import { useEffect, useState } from 'react';

export default function useScryfallCards(names) {
  const [cards, setCards] = useState({});
  const uniqueNames = [...new Set(names)];
  const cardNames = uniqueNames.join('|');

  useEffect(() => {
    let active = true;
    fetch('/api/cards/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: uniqueNames }),
    }).then(async (response) => {
      if (!response.ok) return null;
      return response.json();
    }).then((result) => {
      if (active && result) setCards(Object.fromEntries(result.data.map((card) => [card.name, card])));
    }).catch(() => {});
    return () => { active = false; };
  }, [cardNames]);

  return cards;
}