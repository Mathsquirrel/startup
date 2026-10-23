import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const cardPool = [
  { name: 'Snapcaster Mage', mana: 2, color: 'blue', type: 'creature' },
  { name: 'Lightning Bolt', mana: 1, color: 'red', type: 'instant' },
  { name: 'Opt', mana: 1, color: 'blue', type: 'instant' },
  { name: 'Counterspell', mana: 2, color: 'blue', type: 'instant' },
  { name: 'Llanowar Elves', mana: 1, color: 'green', type: 'creature' },
  { name: 'Cultivate', mana: 3, color: 'green', type: 'sorcery' },
  { name: 'Sol Ring', mana: 1, color: 'colorless', type: 'artifact' },
  { name: 'Rhystic Study', mana: 3, color: 'blue', type: 'enchantment' },
  { name: 'Spellstutter Sprite', mana: 2, color: 'blue', type: 'creature' },
  { name: 'Swords to Plowshares', mana: 1, color: 'white', type: 'instant' },
  { name: 'Island', mana: 0, color: 'blue', type: 'land' },
  { name: 'Mountain', mana: 0, color: 'red', type: 'land' },
  { name: 'Forest', mana: 0, color: 'green', type: 'land' },
];

const starterCards = [
  { name: 'Snapcaster Mage', count: 2 },
  { name: 'Lightning Bolt', count: 4 },
  { name: 'Opt', count: 4 },
  { name: 'Counterspell', count: 3 },
  { name: 'Island', count: 12 },
  { name: 'Mountain', count: 12 },
];

const initialDecks = [
  { id: 'izzet-spellcraft', name: 'Izzet Spellcraft', cards: starterCards },
  { id: 'forest-floor', name: 'Forest Floor', cards: [{ name: 'Forest', count: 18 }, { name: 'Llanowar Elves', count: 4 }, { name: 'Cultivate', count: 4 }] },
  { id: 'draft-collection', name: 'Draft Collection', cards: [{ name: 'Counterspell', count: 8 }, { name: 'Island', count: 12 }] },
];

const DeckContext = createContext(null);
const storageKey = 'pdf-decks';

export function DeckProvider({ children }) {
  const [decks, setDecks] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const savedDecks = stored ? JSON.parse(stored) : initialDecks;
      return savedDecks.map((deck) => ({
        ...deck,
        cards: deck.cards.filter((card) => card.name !== 'Delver of Secrets'),
      }));
    } catch {
      return initialDecks;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(decks));
  }, [decks]);

  const value = useMemo(() => ({
    decks,
    getDeck: (id) => decks.find((deck) => deck.id === id),
    saveDeck: (deck) => {
      setDecks((current) => {
        const existing = current.some((item) => item.id === deck.id);
        return existing ? current.map((item) => item.id === deck.id ? deck : item) : [...current, deck];
      });
    },
    deleteDeck: (id) => setDecks((current) => current.filter((deck) => deck.id !== id)),
  }), [decks]);

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

export function useDecks() {
  const context = useContext(DeckContext);
  if (!context) throw new Error('useDecks must be used within DeckProvider');
  return context;
}

export function getDeckStats(deck) {
  const cards = deck?.cards || [];
  return {
    total: cards.reduce((sum, card) => sum + card.count, 0),
    creatures: cards.filter((card) => cardPool.find((item) => item.name === card.name)?.type === 'creature').reduce((sum, card) => sum + card.count, 0),
    lands: cards.filter((card) => cardPool.find((item) => item.name === card.name)?.type === 'land').reduce((sum, card) => sum + card.count, 0),
    spells: cards.filter((card) => !['creature', 'land'].includes(cardPool.find((item) => item.name === card.name)?.type)).reduce((sum, card) => sum + card.count, 0),
  };
}
