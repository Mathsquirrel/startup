import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { deleteDeckFromService, getAuthToken, getDecks, saveDeckToService } from '../api.js';

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

const DeckContext = createContext(null);

export function DeckProvider({ children }) {
  const [decks, setDecks] = useState([]);
  useEffect(() => {
    const loadDecks = async () => {
      const token = getAuthToken();
      if (!token) {
        setDecks([]);
        return;
      }
      try {
        setDecks(await getDecks(token));
      } catch {
        setDecks([]);
      }
    };
    loadDecks();
    window.addEventListener('auth-changed', loadDecks);
    return () => window.removeEventListener('auth-changed', loadDecks);
  }, []);

  const value = useMemo(() => ({
    decks,
    getDeck: (id) => decks.find((deck) => deck.id === id),
    saveDeck: async (deck) => {
      const token = getAuthToken();
      if (!token) throw new Error('Please log in before saving a deck.');
      const savedDeck = await saveDeckToService(deck, token);
      setDecks((current) => {
        const existing = current.some((item) => item.id === savedDeck.id);
        return existing ? current.map((item) => item.id === savedDeck.id ? savedDeck : item) : [...current, savedDeck];
      });
    },
    deleteDeck: async (id) => {
      const token = getAuthToken();
      if (!token) throw new Error('Please log in before deleting a deck.');
      await deleteDeckFromService(id, token);
      setDecks((current) => current.filter((deck) => deck.id !== id));
    },
  }), [decks]);

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

export function useDecks() {
  const context = useContext(DeckContext);
  if (!context) throw new Error('useDecks must be used within DeckProvider');
  return context;
}

export function getDeckStats(deck, cardDetails = {}) {
  const cards = deck?.cards || [];
  const getType = (card) => {
    if (card.type) return card.type;
    const knownType = cardPool.find((item) => item.name === card.name)?.type;
    if (knownType) return knownType;
    const typeLine = cardDetails[card.name]?.type_line || '';
    return typeLine.includes('Land') ? 'land'
      : typeLine.includes('Creature') ? 'creature'
        : typeLine.includes('Instant') ? 'instant'
          : typeLine.includes('Sorcery') ? 'sorcery'
            : typeLine.includes('Artifact') ? 'artifact'
              : typeLine.includes('Enchantment') ? 'enchantment' : null;
  };
  return {
    total: cards.reduce((sum, card) => sum + card.count, 0),
    creatures: cards.filter((card) => getType(card) === 'creature').reduce((sum, card) => sum + card.count, 0),
    lands: cards.filter((card) => getType(card) === 'land').reduce((sum, card) => sum + card.count, 0),
    sorceries: cards.filter((card) => getType(card) === 'sorcery').reduce((sum, card) => sum + card.count, 0),
    enchantments: cards.filter((card) => getType(card) === 'enchantment').reduce((sum, card) => sum + card.count, 0),
    instants: cards.filter((card) => getType(card) === 'instant').reduce((sum, card) => sum + card.count, 0),
  };
}
