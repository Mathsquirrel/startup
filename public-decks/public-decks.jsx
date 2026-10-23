import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './public-decks.css';
import { imageUrl, Layout } from '../src/components/SiteLayout.jsx';
import useScryfallImages from '../src/hooks/useScryfallImages.js';
import { cardPool } from '../src/context/DeckContext.jsx';

const publicDecks = [['Moonlit Faeries', 'MiraVex', '2026-09-21', 'Sep 21, 2026', '428 views', 'Spellstutter Sprite'], ['Gruul Stampede', 'RootAndRuin', '2026-09-18', 'Sep 18, 2026', '311 views', 'Llanowar Elves'], ['Solar Control', 'NikoPrime', '2026-09-14', 'Sep 14, 2026', '267 views', 'Counterspell'], ['Verdant Reclamation', 'FernAndFable', '2026-09-11', 'Sep 11, 2026', '198 views', 'Cultivate'], ['Steel and Sunrise', 'Dawnkeeper', '2026-09-08', 'Sep 8, 2026', '164 views', 'Swords to Plowshares'], ['Command Tower', 'TabletopTactician', '2026-09-03', 'Sep 3, 2026', '129 views', 'Sol Ring']];
const publicDeckCards = {
  'Moonlit Faeries': [{ name: 'Spellstutter Sprite', count: 4 }, { name: 'Snapcaster Mage', count: 2 }, { name: 'Opt', count: 4 }, { name: 'Island', count: 20 }],
  'Gruul Stampede': [{ name: 'Llanowar Elves', count: 4 }, { name: 'Cultivate', count: 4 }, { name: 'Lightning Bolt', count: 4 }, { name: 'Forest', count: 20 }, { name: 'Mountain', count: 12 }],
  'Solar Control': [{ name: 'Counterspell', count: 4 }, { name: 'Opt', count: 4 }, { name: 'Snapcaster Mage', count: 2 }, { name: 'Island', count: 24 }],
  'Verdant Reclamation': [{ name: 'Llanowar Elves', count: 4 }, { name: 'Cultivate', count: 4 }, { name: 'Rhystic Study', count: 2 }, { name: 'Forest', count: 24 }],
  'Steel and Sunrise': [{ name: 'Swords to Plowshares', count: 4 }, { name: 'Sol Ring', count: 2 }, { name: 'Lightning Bolt', count: 4 }, { name: 'Mountain', count: 24 }],
  'Command Tower': [{ name: 'Sol Ring', count: 4 }, { name: 'Counterspell', count: 4 }, { name: 'Island', count: 24 }],
};
const viewCountsStorageKey = 'pdf-public-deck-view-counts';

function getPublicDeckDetails(deck) {
  const cards = publicDeckCards[deck[0]] || [];
  const counts = cards.reduce((result, card) => {
    const type = cardPool.find((item) => item.name === card.name)?.type;
    if (type) result[type] = (result[type] || 0) + card.count;
    return result;
  }, {});
  return { cards, total: cards.reduce((total, card) => total + card.count, 0), counts };
}

export default function PublicDecksPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [viewCounts, setViewCounts] = useState(() => {
    const defaults = Object.fromEntries(publicDecks.map((deck) => [deck[0], 0]));
    try {
      const stored = localStorage.getItem(viewCountsStorageKey);
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });
  const images = useScryfallImages(publicDecks.map((deck) => ({ cardName: deck[5] })));
  const visibleDecks = publicDecks.filter((deck) => deck.join(' ').toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (!selected) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selected]);
  useEffect(() => {
    localStorage.setItem(viewCountsStorageKey, JSON.stringify(viewCounts));
  }, [viewCounts]);
  const selectedDetails = selected ? getPublicDeckDetails(selected) : null;
  const builderDeck = selected ? { id: `public-${selected[0].toLowerCase().replaceAll(' ', '-')}`, name: selected[0], cards: selectedDetails.cards } : null;
  return <Layout footerText="Share your brewing discoveries with the table"><main><div className="intro"><div><p className="eyebrow">The community shelf</p><h2>Find a list worth testing.</h2><p>Browse public decklists from fellow players, inspect their game plan, and save a copy to your own workshop.</p></div><img className="hero-image" src={imageUrl('publicDecks.png')} alt="Public Magic: The Gathering decks" /></div><section aria-labelledby="featured-title"><div className="section-toolbar"><h3 id="featured-title">Most Popular Decks</h3><form className="deck-search" role="search" onSubmit={(event) => event.preventDefault()}><label htmlFor="public-deck-search">Search public decks</label><input id="public-deck-search" type="search" placeholder="Search decks or players" value={query} onChange={(event) => setQuery(event.target.value)} /></form></div><div className="public-deck-list">{visibleDecks.map((deck) => <article className="public-deck-row" key={deck[0]} style={images[deck[5]] ? { backgroundImage: `url('${images[deck[5]]}')` } : undefined}><h4>{deck[0]}</h4><span className="deck-publisher">{deck[1]}</span><time dateTime={deck[2]}>{deck[3]}</time><span>{viewCounts[deck[0]]} views</span><button type="button" onClick={() => setSelected(deck)}>Overview</button></article>)}</div></section></main>{selected && <dialog open className="deck-dialog" aria-labelledby="public-deck-title"><div className="deck-dialog-content"><button className="modal-close" type="button" aria-label="Close deck details" onClick={() => setSelected(null)}>×</button><p className="eyebrow">Community deck</p><h2 id="public-deck-title">{selected[0]}</h2><p>Published by {selected[1]} on {selected[3]}.</p><dl className="deck-stats"><div><dt>Total cards</dt><dd>{selectedDetails.total}</dd></div>{[['creature', 'Creatures'], ['instant', 'Instants'], ['sorcery', 'Sorceries'], ['artifact', 'Artifacts'], ['enchantment', 'Enchantments'], ['land', 'Lands']].map(([type, label]) => <div key={type}><dt>{label}</dt><dd>{selectedDetails.counts[type] || 0}</dd></div>)}</dl><ul className="public-card-list">{selectedDetails.cards.map((card) => <li key={card.name}>{card.name} <span>{card.count}</span></li>)}</ul><div className="modal-actions"><Link className="modal-action" to="/builder?fromDecks=1" state={{ deck: builderDeck }} onClick={() => setViewCounts((counts) => ({ ...counts, [selected[0]]: counts[selected[0]] + 1 }))}>Open in builder</Link><button className="modal-action" type="button" onClick={() => setSelected(null)}>Close</button></div></div></dialog>}</Layout>;
}