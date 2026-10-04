import { useState } from 'react';
import './site.css';
import { imageUrl, Layout } from '../src/components/SiteLayout.jsx';
import useScryfallImages from '../src/hooks/useScryfallImages.js';

const publicDecks = [['Moonlit Faeries', 'MiraVex', '2026-09-21', 'Sep 21, 2026', '428 views', 'Spellstutter Sprite'], ['Gruul Stampede', 'RootAndRuin', '2026-09-18', 'Sep 18, 2026', '311 views', 'Llanowar Elves'], ['Solar Control', 'NikoPrime', '2026-09-14', 'Sep 14, 2026', '267 views', 'Counterspell'], ['Verdant Reclamation', 'FernAndFable', '2026-09-11', 'Sep 11, 2026', '198 views', 'Cultivate'], ['Steel and Sunrise', 'Dawnkeeper', '2026-09-08', 'Sep 8, 2026', '164 views', 'Swords to Plowshares'], ['Command Tower', 'TabletopTactician', '2026-09-03', 'Sep 3, 2026', '129 views', 'Sol Ring']];

export default function PublicDecksPage() {
  const [query, setQuery] = useState('');
  const images = useScryfallImages(publicDecks.map((deck) => ({ cardName: deck[5] })));
  const visibleDecks = publicDecks.filter((deck) => deck.join(' ').toLowerCase().includes(query.toLowerCase()));
  return <Layout footerText="Share your brewing discoveries with the table"><main><div className="intro"><div><p className="eyebrow">The community shelf</p><h2>Find a list worth testing.</h2><p>Browse public decklists from fellow players, inspect their game plan, and save a copy to your own workshop.</p></div><img className="hero-image" src={imageUrl('publicDecks.png')} alt="Public Magic: The Gathering decks" /></div><section aria-labelledby="featured-title"><div className="section-toolbar"><h3 id="featured-title">Most Popular Decks</h3><form className="deck-search" role="search" onSubmit={(event) => event.preventDefault()}><label htmlFor="public-deck-search">Search public decks</label><input id="public-deck-search" type="search" placeholder="Search decks or players" value={query} onChange={(event) => setQuery(event.target.value)} /></form></div><div className="public-deck-list">{visibleDecks.map((deck) => <article className="public-deck-row" key={deck[0]} style={images[deck[5]] ? { backgroundImage: `url('${images[deck[5]]}')` } : undefined}><h4>{deck[0]}</h4><span className="deck-publisher">{deck[1]}</span><time dateTime={deck[2]}>{deck[3]}</time><span>{deck[4]}</span><button type="button">View deck</button></article>)}</div></section></main></Layout>;
}