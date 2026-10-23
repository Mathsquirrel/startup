import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import './builder.css';
import { Layout } from '../src/components/SiteLayout.jsx';
import useScryfallCards from '../src/hooks/useScryfallCards.js';
import useScryfallSearch from '../src/hooks/useScryfallSearch.js';
import { cardPool, getDeckStats, useDecks } from '../src/context/DeckContext.jsx';

function countCards(cards, name) {
  return cards.find((card) => card.name === name)?.count || 0;
}

export default function BuilderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { getDeck, saveDeck } = useDecks();
  const deckId = params.get('deckId');
  const existingDeck = deckId ? getDeck(deckId) : null;
  const [deck, setDeck] = useState(() => existingDeck || location.state?.deck || { id: `deck-${Date.now()}`, name: 'Untitled deck', cards: [] });
  const [search, setSearch] = useState('');
  const [mana, setMana] = useState('none');
  const [color, setColor] = useState('all');
  const [type, setType] = useState('all');
  const [notice, setNotice] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [menuPlacement, setMenuPlacement] = useState('same');
  const [availableCards, setAvailableCards] = useState(cardPool);
  const { suggestions, loading: suggestionsLoading } = useScryfallSearch(search);
  const cards = useScryfallCards(availableCards.map((card) => card.name));

  useEffect(() => {
    if (!params.has('fromDecks')) navigate('/personal-decks', { replace: true });
  }, [navigate, params]);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!event.target.closest('.card-list li')) setSelectedCard(null);
    };
    document.addEventListener('pointerdown', closeMenu);
    return () => document.removeEventListener('pointerdown', closeMenu);
  }, []);

  const filtered = useMemo(() => availableCards
    .filter((card) => card.name.toLowerCase().includes(search.toLowerCase()))
    .filter((card) => color === 'all' || card.color === color)
    .filter((card) => type === 'all' || card.type === type)
    .sort((first, second) => mana === 'high' ? second.mana - first.mana : mana === 'low' ? first.mana - second.mana : 0), [availableCards, search, color, type, mana]);

  const updateCount = (name, change) => setDeck((current) => {
    const cards = current.cards.map((card) => card.name === name ? { ...card, count: card.count + change } : card).filter((card) => card.count > 0);
    if (change > 0 && !current.cards.some((card) => card.name === name)) cards.push({ name, count: 1 });
    if (change < 0 && !cards.some((card) => card.name === name)) setSelectedCard(null);
    return { ...current, cards };
  });

  const addScryfallCard = async (name) => {
    try {
      const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
      if (!response.ok) throw new Error(`Scryfall card lookup returned ${response.status}`);
      const result = await response.json();
      const typeLine = result.type_line || '';
      const type = typeLine.includes('Land') ? 'land'
        : typeLine.includes('Creature') ? 'creature'
          : typeLine.includes('Instant') ? 'instant'
            : typeLine.includes('Sorcery') ? 'sorcery'
              : typeLine.includes('Artifact') ? 'artifact'
                : typeLine.includes('Enchantment') ? 'enchantment' : 'instant';
      const card = {
        name: result.name,
        mana: result.cmc || 0,
        color: result.colors?.[0]?.toLowerCase() || 'colorless',
        type,
      };
      setAvailableCards((current) => current.some((item) => item.name === card.name) ? current : [...current, card]);
      updateCount(card.name, 1);
      setSearch('');
      setNotice(`${card.name} added to the deck.`);
    } catch {
      setNotice(`Unable to load ${name} from Scryfall.`);
    }
  };

  const save = (event) => {
    event.preventDefault();
    saveDeck(deck);
    navigate('/personal-decks');
  };

  const selectCard = (cardKey, groupIndex, element) => {
    if (selectedCard === cardKey) {
      setSelectedCard(null);
      return;
    }
    const cardRect = element.getBoundingClientRect();
    const menuWidth = 164;
    const menuHeight = 180;
    const gap = 12;
    const previewOffset = 250;
    const previewOnLeft = groupIndex === 1 || groupIndex === 2 || groupIndex === 4 || groupIndex === 5;
    const navigationRight = document.querySelector('header')?.getBoundingClientRect().right || 0;
    const sameLeft = previewOnLeft ? cardRect.left - previewOffset - menuWidth : cardRect.right + previewOffset;
    const oppositeLeft = previewOnLeft ? cardRect.right + gap : cardRect.left - menuWidth - gap;
    const fitsHorizontally = (left) => left >= navigationRight && left + menuWidth <= window.innerWidth;
    const menuTop = cardRect.top + (cardRect.height - menuHeight) / 2;
    const fitsVertically = menuTop >= 0 && menuTop + menuHeight <= window.innerHeight;
    const sameFits = fitsHorizontally(sameLeft) && fitsVertically;
    const oppositeFits = fitsHorizontally(oppositeLeft) && fitsVertically;
    setMenuPlacement(sameFits ? 'same' : oppositeFits ? 'opposite' : 'contained');
    setSelectedCard(cardKey);
  };

  if (!params.has('fromDecks')) return null;
  const stats = getDeckStats(deck);
  const cardTypeCounts = ['creature', 'instant', 'sorcery', 'artifact', 'enchantment', 'land'].reduce((counts, cardType) => ({
    ...counts,
    [cardType]: deck.cards
      .filter((deckCard) => availableCards.find((card) => card.name === deckCard.name)?.type === cardType)
      .reduce((total, card) => total + card.count, 0),
  }), {});

  return <Layout builder footerText="PDF Decks helps you turn ideas into playable lists.">
    <main className="builder-main">
      <form className="builder-toolbar" role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="card-search">Search cards</label>
        <div className="card-search-field">
          <input id="card-search" type="search" placeholder="Search by card name" value={search} onChange={(event) => setSearch(event.target.value)} />
          {(suggestions.length > 0 || suggestionsLoading) && <ul className="card-suggestions" aria-label="Card suggestions">
            {suggestionsLoading && <li className="suggestions-status">Searching Scryfall...</li>}
            {suggestions.map((suggestion) => <li key={suggestion}><button type="button" onClick={() => addScryfallCard(suggestion)}>{suggestion}</button></li>)}
          </ul>}
        </div>
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
          <button type="submit">Save Deck</button>
          <button type="button" onClick={() => setDeck((current) => ({ ...current, cards: [] }))}>Clear cards</button>
        </form>
        <h3 id="deck-editor-title">Choose cards for {deck.name}</h3>
        <div className="card-groups">
          {['creature', 'instant', 'sorcery', 'artifact', 'enchantment', 'land'].map((group, groupIndex) => {
            const groupCards = filtered.filter((card) => card.type === group);
            if (!groupCards.length) return null;
            return <section className={`card-group card-group-${groupIndex + 1}`} key={group}><h4>{group[0].toUpperCase() + group.slice(1)} ({cardTypeCounts[group]})</h4><ul className="card-list">
              {groupCards.flatMap((card) => {
                const cardData = cards[card.name];
                const imageUrl = cardData?.image_uris?.normal || cardData?.card_faces?.[0]?.image_uris?.normal;
                const count = countCards(deck.cards, card.name);
                return Array.from({ length: count }, (_, copyIndex) => {
                  const cardKey = `${card.name}-${copyIndex}`;
                  const isSelected = selectedCard === cardKey;
                  return <li key={cardKey} className={`${count ? 'in-deck' : ''}${isSelected ? ' selected' : ''}`} onClick={(event) => selectCard(cardKey, groupIndex, event.currentTarget)} aria-label={`${card.name}, ${count} in deck`} aria-pressed={isSelected} tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectCard(cardKey, groupIndex, event.currentTarget); } }}>
                  {imageUrl && <><img className="card-image" src={imageUrl} alt={`${card.name} card image`} loading="lazy" /><img className="card-preview" src={imageUrl} alt="" aria-hidden="true" loading="lazy" /></>}
                  <div className={`card-controls ${menuPlacement}-menu`} aria-label={`${card.name} actions`} onClick={(event) => event.stopPropagation()}><strong>{card.name}</strong><span>{count} in deck</span><button className="remove-one-button" type="button" onClick={() => updateCount(card.name, -1)} disabled={!count}>Remove one</button><button className="add-one-button" type="button" onClick={() => updateCount(card.name, 1)}>Add one</button><button className="remove-all-button" type="button" onClick={() => { updateCount(card.name, -count); setSelectedCard(null); }} disabled={!count}>Remove all</button></div>
                  </li>;
                });
              })}
            </ul></section>;
          })}
        </div>
        <p className="status" aria-live="polite">Creatures: {cardTypeCounts.creature} · Instants: {cardTypeCounts.instant} · Sorceries: {cardTypeCounts.sorcery} · Artifacts: {cardTypeCounts.artifact} · Enchantments: {cardTypeCounts.enchantment} · Lands: {cardTypeCounts.land} · Total: {stats.total}</p>
      </section>
    </main>
  </Layout>;
}
