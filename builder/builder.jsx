import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './builder.css';
import { Layout } from '../src/components/SiteLayout.jsx';
import useScryfallCards from '../src/hooks/useScryfallCards.js';

const builderCards = [
  { name: 'Snapcaster Mage', count: 2, mana: 2, color: 'blue', type: 'creature' },
  { name: 'Delver of Secrets', count: 4, mana: 1, color: 'blue', type: 'creature' },
  { name: 'Lightning Bolt', count: 4, mana: 1, color: 'red', type: 'instant' },
  { name: 'Opt', count: 4, mana: 1, color: 'blue', type: 'instant' },
  { name: 'Counterspell', count: 3, mana: 2, color: 'blue', type: 'instant' },
  { name: 'Island', count: 12, mana: 0, color: 'blue', type: 'land' },
  { name: 'Mountain', count: 12, mana: 0, color: 'red', type: 'land' },
];

export default function BuilderPage() {
  const navigate = useNavigate();
  const allowed = new URLSearchParams(window.location.search).has('fromDecks');
  const [search, setSearch] = useState('');
  const [mana, setMana] = useState('none');
  const [color, setColor] = useState('all');
  const [type, setType] = useState('all');
  const cards = useScryfallCards(builderCards.map((card) => card.name));

  useEffect(() => {
    sessionStorage.removeItem('builderAccess');
    if (!allowed) navigate('/personal-decks', { replace: true });
  }, [allowed, navigate]);

  const filtered = [...builderCards]
    .filter((card) => card.name.toLowerCase().includes(search.toLowerCase()))
    .filter((card) => color === 'all' || card.color === color)
    .filter((card) => type === 'all' || card.type === type)
    .sort((first, second) => mana === 'high'
      ? second.mana - first.mana
      : mana === 'low' ? first.mana - second.mana : 0);

  if (!allowed) return null;

  return <Layout builder footerText="PDF Decks helps you turn ideas into playable lists.">
    <main className="builder-main">
      <form className="builder-toolbar" role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="card-search">Search cards</label>
        <input id="card-search" type="search" placeholder="Search by card name" value={search} onChange={(event) => setSearch(event.target.value)} />
        <label htmlFor="sort-mana">Mana value</label>
        <select id="sort-mana" value={mana} onChange={(event) => setMana(event.target.value)}>
          <option value="none">Any</option>
          <option value="low">Low to high</option>
          <option value="high">High to low</option>
        </select>
        <label htmlFor="sort-color">Color</label>
        <select id="sort-color" value={color} onChange={(event) => setColor(event.target.value)}>
          <option value="all">All colors</option>
          <option value="blue">Blue</option>
          <option value="red">Red</option>
          <option value="colorless">Colorless</option>
        </select>
        <label htmlFor="sort-type">Card type</label>
        <select id="sort-type" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">All types</option>
          <option value="creature">Creature</option>
          <option value="instant">Instant</option>
          <option value="sorcery">Sorcery</option>
          <option value="land">Land</option>
        </select>
      </form>
      <section className="builder-workspace" aria-labelledby="deck-editor-title">
        <h3 id="deck-editor-title">Deck editor: Izzet Spellcraft</h3>
        <div className="card-groups">
          {['creature', 'instant', 'land'].map((group) => <section className="card-group" key={group}>
            <h4>{group === 'creature' ? 'Creatures' : group === 'instant' ? 'Instants & Sorceries' : 'Lands'}</h4>
            <ul className="card-list">
              {filtered.filter((card) => card.type === group).map((card) => {
                const cardData = cards[card.name];
                const imageUrl = cardData?.image_uris?.normal || cardData?.card_faces?.[0]?.image_uris?.normal;
                return <li key={card.name}>
                  <div className="card-summary"><span className="card-count">{card.count}x</span><strong>{card.name}</strong></div>
                  {imageUrl && <img className="card-image" src={imageUrl} alt={`${card.name} card image`} loading="lazy" />}
                </li>;
              })}
            </ul>
          </section>)}
        </div>
        <p className="status" aria-live="polite">{Object.keys(cards).length === builderCards.length ? 'Card images loaded from Scryfall.' : 'Loading card images...'}</p>
      </section>
    </main>
  </Layout>;
}
