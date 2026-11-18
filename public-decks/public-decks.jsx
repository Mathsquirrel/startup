import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './public-decks.css';
import { imageUrl, Layout } from '../src/components/SiteLayout.jsx';
import useScryfallImages from '../src/hooks/useScryfallImages.js';
import useScryfallCards from '../src/hooks/useScryfallCards.js';
import { cardPool } from '../src/context/DeckContext.jsx';
import { getPublishedDecks, getPublicDeckViews, incrementPublicDeckView } from '../src/api.js';

function getPublicDeckDetails(deck) {
  const cards = deck[6] || [];
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
  const [publishedDecks, setPublishedDecks] = useState([]);
  const [viewCounts, setViewCounts] = useState({});
  const cardDetails = useScryfallCards(publishedDecks.flatMap((deck) => deck.cards.map((card) => card.name)));
  const publishedDeckRows = publishedDecks.map((deck) => {
    const creatureCard = deck.cards.find((card) =>
      cardDetails[card.name]?.type_line?.toLowerCase().includes('creature'));
    const backgroundCard = creatureCard?.name || deck.cards[0]?.name;
    return [deck.name, deck.author, deck.date, new Date(deck.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), '0 views', backgroundCard, deck.cards];
  });
  const allPublicDecks = publishedDeckRows;
  const images = useScryfallImages(allPublicDecks.map((deck) => ({ cardName: deck[5] })));
  const visibleDecks = allPublicDecks.filter((deck) => deck.join(' ').toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (!selected) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selected]);
  useEffect(() => {
    getPublishedDecks().then(setPublishedDecks).catch(() => setPublishedDecks([]));
  }, []);
  useEffect(() => {
    getPublicDeckViews().then((counts) => {
      setViewCounts((defaults) => ({ ...defaults, ...counts }));
    }).catch(() => {});
  }, []);
  const selectedDetails = selected ? getPublicDeckDetails(selected) : null;
  const builderDeck = selected ? { id: `public-${selected[0].toLowerCase().replaceAll(' ', '-')}`, name: selected[0], cards: selectedDetails.cards } : null;
  return <Layout footerText="Share your brewing discoveries with the table"><main><div className="intro"><div><p className="eyebrow">The community shelf</p><h2>Find a list worth testing.</h2><p>Browse public decklists from fellow players, inspect their game plan, and save a copy to your own workshop.</p></div><img className="hero-image" src={imageUrl('publicDecks.png')} alt="Public Magic: The Gathering decks" /></div><section aria-labelledby="featured-title"><div className="section-toolbar"><h3 id="featured-title">Most Popular Decks</h3><form className="deck-search" role="search" onSubmit={(event) => event.preventDefault()}><label htmlFor="public-deck-search">Search public decks</label><input id="public-deck-search" type="search" placeholder="Search decks or players" value={query} onChange={(event) => setQuery(event.target.value)} /></form></div>  <div className="public-deck-list">{visibleDecks.map((deck) => <article className="public-deck-row" key={deck[0]} style={images[deck[5]] ? { backgroundImage: `url('${images[deck[5]]}')` } : undefined}><h4>{deck[0]}</h4><span className="deck-publisher">{deck[1]}</span><time dateTime={deck[2]}>{deck[3]}</time><span>{viewCounts[deck[0]] || 0} views</span><button type="button" onClick={() => setSelected(deck)}>Overview</button></article>)}</div></section></main>{selected && <dialog open className="deck-dialog" aria-labelledby="public-deck-title"><div className="deck-dialog-content"><button className="modal-close" type="button" aria-label="Close deck details" onClick={() => setSelected(null)}>×</button><p className="eyebrow">Community deck</p><h2 id="public-deck-title">{selected[0]}</h2><p>Published by {selected[1]} on {selected[3]}.</p><dl className="deck-stats"><div><dt>Total cards</dt><dd>{selectedDetails.total}</dd></div>{[['creature', 'Creatures'], ['instant', 'Instants'], ['sorcery', 'Sorceries'], ['artifact', 'Artifacts'], ['enchantment', 'Enchantments'], ['land', 'Lands']].map(([type, label]) => <div key={type}><dt>{label}</dt><dd>{selectedDetails.counts[type] || 0}</dd></div>)}</dl><ul className="public-card-list">{selectedDetails.cards.map((card) => <li key={card.name}>{card.name} <span>{card.count}</span></li>)}</ul>  <div className="modal-actions"><Link className="modal-action" to="/builder?fromDecks=1" state={{ deck: builderDeck }} onClick={async () => { const count = await incrementPublicDeckView(selected[0]).catch(() => null); if (count !== null) setViewCounts((counts) => ({ ...counts, [selected[0]]: count })); }}>Open in builder</Link><button className="modal-action" type="button" onClick={() => setSelected(null)}>Close</button></div></div></dialog>}</Layout>;
}