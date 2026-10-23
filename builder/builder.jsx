import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './builder.css';
import { Layout } from '../src/components/SiteLayout.jsx';
import useScryfallCards from '../src/hooks/useScryfallCards.js';
import { cardPool, getDeckStats, useDecks } from '../src/context/DeckContext.jsx';

function countCards(cards, name) {
  return cards.find((card) => card.name === name)?.count || 0;
}

export default function BuilderPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { getDeck, saveDeck } = useDecks();
  const deckId = params.get('deckId');
  const existingDeck = deckId ? getDeck(deckId) : null;
  const [deck, setDeck] = useState(() => existingDeck || { id: `deck-${Date.now()}`, name: 'Untitled deck', cards: [] });
  const [search, setSearch] = useState('');
  const [mana, setMana] = useState('none');
  const [color, setColor] = useState('all');
  const [type, setType] = useState('all');
  const [notice, setNotice] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const cards = useScryfallCards(cardPool.map((card) => card.name));

  useEffect(() => {
    if (!params.has('fromDecks')) navigate('/personal-decks', { replace: true });
  }, [navigate, params]);

  const filtered = useMemo(() => cardPool
    .filter((card) => card.name.toLowerCase().includes(search.toLowerCase()))
    .filter((card) => color === 'all' || card.color === color)
    .filter((card) => type === 'all' || card.type === type)
    .sort((first, second) => mana === 'high' ? second.mana - first.mana : mana === 'low' ? first.mana - second.mana : 0), [search, color, type, mana]);

  const updateCount = (name, change) => setDeck((current) => {
    const cards = current.cards.map((card) => card.name === name ? { ...card, count: card.count + change } : card).filter((card) => card.count > 0);
    if (change > 0 && !current.cards.some((card) => card.name === name)) cards.push({ name, count: 1 });
    return { ...current, cards };
  });

  const save = (event) => {
    event.preventDefault();
    saveDeck(deck);
    setNotice(`${deck.name} saved locally.`);
  };

  if (!params.has('fromDecks')) return null;
  const stats = getDeckStats(deck);

  return <Layout builder footerText="PDF Decks helps you turn ideas into playable lists.">
    <main className="builder-main">
      <form className="builder-toolbar" role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="card-search">Search cards</label>
        <input id="card-search" type="search" placeholder="Search by card name" value={search} onChange={(event) => setSearch(event.target.value)} />
        <label htmlFor="sort-mana">Mana value</label>
        <select id="sort-mana" value={mana} onChange={(event) => setMana(event.target.value)}><option value="none">Any</option><option value="low">Low to high</option><option value="high">High to low</option></select>
        <label htmlFor="sort-color">Color</label>
        <select id="sort-color" value={color} onChange={(event) => setColor(event.target.value)}><option value="all">All colors</option>{['blue', 'red', 'green', 'white', 'colorless'].map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <label htmlFor="sort-type">Card type</label>
        <select id="sort-type" value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option>{['creature', 'instant', 'sorcery', 'artifact', 'enchantment', 'land'].map((value) => <option key={value} value={value}>{value}</option>)}</select>
      </form>
      <section className="builder-workspace" aria-labelledby="deck-editor-title">
        <form className="deck-editor-heading" onSubmit={save}>
          <div><label htmlFor="deck-name">Deck name</label><input id="deck-name" value={deck.name} onChange={(event) => setDeck((current) => ({ ...current, name: event.target.value }))} /></div>
          <p className="deck-total">{stats.total} cards</p>
          <button type="submit">Save deck</button>
          <button type="button" onClick={() => setDeck((current) => ({ ...current, cards: [] }))}>Clear cards</button>
          <button type="button" onClick={() => navigate('/personal-decks')}>Done</button>
        </form>
        <h3 id="deck-editor-title">Choose cards for {deck.name}</h3>
        <div className="card-groups">
          {['creature', 'instant', 'sorcery', 'artifact', 'enchantment', 'land'].map((group, groupIndex) => {
            const groupCards = filtered.filter((card) => card.type === group);
            if (!groupCards.length) return null;
            return <section className={`card-group card-group-${groupIndex + 1}`} key={group}><h4>{group[0].toUpperCase() + group.slice(1)}</h4><ul className="card-list">
              {groupCards.flatMap((card) => {
                const cardData = cards[card.name];
                const imageUrl = cardData?.image_uris?.normal || cardData?.card_faces?.[0]?.image_uris?.normal;
                const count = countCards(deck.cards, card.name);
                const copies = count > 0 ? count : 1;
                return Array.from({ length: copies }, (_, copyIndex) => {
                  const cardKey = `${card.name}-${copyIndex}`;
                  const isSelected = selectedCard === cardKey;
                  return <li key={cardKey} className={`${count ? 'in-deck' : ''}${isSelected ? ' selected' : ''}`} onClick={() => setSelectedCard((current) => current === cardKey ? null : cardKey)} aria-label={`${card.name}, ${count} in deck`} aria-pressed={isSelected} tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedCard((current) => current === cardKey ? null : cardKey); } }}>
                  {imageUrl && <><img className="card-image" src={imageUrl} alt={`${card.name} card image`} loading="lazy" /><img className="card-preview" src={imageUrl} alt="" aria-hidden="true" loading="lazy" /></>}
                  <div className="card-controls" aria-label={`${card.name} actions`} onClick={(event) => event.stopPropagation()}><strong>{card.name}</strong><span>{count} in deck</span><button className="remove-one-button" type="button" onClick={() => updateCount(card.name, -1)} disabled={!count}>Remove one</button><button className="add-one-button" type="button" onClick={() => updateCount(card.name, 1)}>Add one</button><button className="remove-all-button" type="button" onClick={() => { updateCount(card.name, -count); setSelectedCard(null); }} disabled={!count}>Remove all</button></div>
                  </li>;
                });
              })}
            </ul></section>;
          })}
        </div>
        <p className="status" aria-live="polite">{notice || `${stats.creatures} creatures · ${stats.spells} spells · ${stats.lands} lands${Object.keys(cards).length === cardPool.length ? ' · Card images loaded.' : ' · Loading card images...'}`}</p>
      </section>
    </main>
  </Layout>;
}
