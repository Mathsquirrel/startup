import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const imageUrl = (name) => `/images/${name}`;

function Header({ builder = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('builder-nav-collapsed', builder && collapsed);
    return () => document.body.classList.remove('builder-nav-collapsed');
  }, [builder, collapsed]);

  return (
    <header className={builder ? `collapsible-sidebar${collapsed ? ' nav-collapsed' : ''}` : ''}>
      <div className="header-inner">
        <div className="brand">
          <img className="brand-logo" src={imageUrl('poisonDart.png')} alt="Poison dart frog logo" />
          <h1>PDF DECKS</h1>
          <form className="login-form" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-username`}>Username</label>
            <input id={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-username`} name="username" type="text" placeholder="Username" autoComplete="username" />
            <label htmlFor={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-password`}>Password</label>
            <input id={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-password`} name="password" type="password" placeholder="Password" autoComplete="current-password" />
            <button type="submit">Log in</button>
          </form>
        </div>
        <section className="friend-list" aria-labelledby="friends-title">
          <h2 id="friends-title">Friends</h2>
          <ul />
          <p className="friend-login-note">No Friends Have Been Added Yet</p>
        </section>
        <nav className="btn-group" aria-label="Primary navigation">
          <NavLink className="btn btn-primary" to="/">Home</NavLink>
          <NavLink className="btn btn-primary" to="/public-decks">Public Decks</NavLink>
          <NavLink className="btn btn-primary" to="/personal-decks">My Decks</NavLink>
        </nav>
        {builder && <button className="nav-toggle" type="button" aria-expanded={!collapsed} aria-label={collapsed ? 'Open navigation' : 'Close navigation'} onClick={() => setCollapsed((value) => !value)} />}
      </div>
    </header>
  );
}

function Layout({ children, builder = false, footerText }) {
  return <><Header builder={builder} />{children}<footer><p>{footerText}</p></footer></>;
}

function HomePage() {
  return <Layout footerText="PDF Decks is the place where ideas become real.">
    <main>
      <section aria-labelledby="author-title"><h2 id="author-title">Noah Sparks</h2><p><a href="https://github.com/Mathsquirrel/startup">View the GitHub repository</a></p></section>
      <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><p className="kicker">A workshop for your next game</p><h2 id="hero-title">Build a deck worth shuffling.</h2><p>PDF Decks is an MTG deckbuilder for brewing lists, finding the right cards, and keeping every idea in one place.</p><div className="hero-actions"><Link className="button" to="/personal-decks">Open My Decks</Link><Link className="text-link" to="/public-decks">Browse public decks</Link></div></div></section>
      <section aria-labelledby="tools-title"><div className="section-heading"><h3 id="tools-title">From first idea to finished list.</h3><p>Everything you need to keep brewing.</p></div><div className="tools"><article className="tool"><span className="tool-number">01 / BUILD</span><h4>Shape the main deck</h4><p>Assemble a list and see the cards as you add them.</p><Link className="text-link" to="/personal-decks">Start a deck</Link></article><article className="tool"><span className="tool-number">02 / DISCOVER</span><h4>Find your next card</h4><p>Search the card pool and explore ideas from other brewers.</p><Link className="text-link" to="/public-decks">See the shelf</Link></article><article className="tool"><span className="tool-number">03 / KEEP</span><h4>Save every version</h4><p>Return to your personal decks whenever inspiration strikes.</p><Link className="text-link" to="/personal-decks">Open my decks</Link></article></div></section>
      <section className="news" aria-labelledby="news-title"><div><p className="kicker">Recent/Upcoming Changes</p><h3 id="news-title">News from the workshop</h3></div><div className="news-list"><NewsItem date="Oct 1, 2026" title="Public decks will open for browsing" text="See what other players are building and find a new direction for your next brew." /><NewsItem date="Sep 24, 2026" title="My Decks gets a cleaner home" text="Saved lists now have a dedicated shelf with account and friend status." /><NewsItem date="Sep 18, 2026" title="Card images now load in the main deck" text="Every card in the builder gets its artwork directly from Scryfall." /></div></section>
    </main>
  </Layout>;
}

function NewsItem({ date, title, text }) { return <article className="news-item"><div className="news-date">{date}</div><div><h4>{title}</h4><p>{text}</p></div></article>; }

const savedDecks = [
  ['Izzet Spellcraft', '60 cards', 'Lightning Bolt', 18, 24, 18], ['Forest Floor', '72 cards', 'Opt', 28, 26, 18], ['Draft Collection', '40 cards', 'Counterspell', 8, 24, 28], ["Atraxa's Assembly", '100 cards | Commander', 'Sol Ring', 32, 37, 31], ['Grove of Giants', '100 cards | Commander', 'Cultivate', 36, 38, 26], ['Tidal Conspiracy', '100 cards | Commander', 'Rhystic Study', 24, 35, 41],
];

function useScryfallImages(items, nameKey = 'cardName') {
  const [images, setImages] = useState({});
  const itemNames = items.map((item) => typeof item === 'string' ? item : item[nameKey]).join('|');
  useEffect(() => {
    let active = true;
    Promise.all(items.map(async (item) => {
      const name = typeof item === 'string' ? item : item[nameKey];
      try {
        const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
        if (!response.ok) return null;
        const card = await response.json();
        return [name, card.image_uris?.art_crop || card.image_uris?.normal];
      } catch { return null; }
    })).then((results) => { if (active) setImages(Object.fromEntries(results.filter(Boolean))); });
    return () => { active = false; };
  }, [itemNames, nameKey]);
  return images;
}

function PersonalDecksPage() {
  const [selected, setSelected] = useState(null);
  const [decks, setDecks] = useState(savedDecks);
  const images = useScryfallImages(decks.map((deck) => ({ cardName: deck[2] })));
  const close = () => setSelected(null);
  const share = async () => { try { await navigator.clipboard.writeText(`${selected[0]} on PDF Decks - ${window.location.href}`); } catch { /* Clipboard can be unavailable in local previews. */ } };
  return <Layout footerText="Your decks, your experiments, your next great game."><main><div className="intro"><div><p className="eyebrow">Your private vault</p><h2>Keep every brew close at hand.</h2><p>Review your saved lists, return to unfinished ideas, and share a deck when it is ready for the table.</p></div></div><section aria-labelledby="saved-title"><h3 id="saved-title">Saved decklists</h3><div className="deck-grid saved-deck-grid">{decks.map((deck) => <button className="deck" key={deck[0]} style={images[deck[2]] ? { backgroundImage: `url('${images[deck[2]]}')` } : undefined} onClick={() => setSelected(deck)}><h4>{deck[0]}</h4><p className="meta">{deck[1]}</p></button>)}<button className="deck create-deck" onClick={() => setSelected(['Create a new deck', '', '', '-', '-', '-'])}><span aria-hidden="true">+</span><h4>Create deck</h4></button></div></section></main>{selected && <DeckDialog deck={selected} image={images[selected[2]]} onClose={close} onShare={share} onDelete={() => { setDecks((current) => current.filter((deck) => deck[0] !== selected[0])); close(); }} />}</Layout>;
}

function DeckDialog({ deck, image, onClose, onShare, onDelete }) {
  const isCreate = !deck[2];
  return <dialog open className="deck-dialog"><button className="modal-close" type="button" aria-label="Close deck details" onClick={onClose}>×</button>{image && <img className="deck-preview-image" src={image} alt={`${deck[0]} featured card`} />}<p className="eyebrow">{isCreate ? 'Start a new list' : 'Deck details'}</p><h2>{deck[0]}</h2><dl className="deck-stats"><div><dt>Creatures</dt><dd>{deck[3]}</dd></div><div><dt>Lands</dt><dd>{deck[4]}</dd></div><div><dt>Spells</dt><dd>{deck[5]}</dd></div></dl><div className="modal-actions"><Link className="modal-action" to="/builder?fromDecks=1" onClick={() => sessionStorage.setItem('builderAccess', 'true')}>{isCreate ? 'Create deck' : 'Edit deck'}</Link>{!isCreate && <><button className="modal-action" type="button" onClick={onShare}>Share</button><button className="modal-action delete-action" type="button" onClick={onDelete}>Delete</button></>}</div></dialog>;
}

const publicDecks = [['Moonlit Faeries', 'MiraVex', '2026-09-21', 'Sep 21, 2026', '428 views', 'Spellstutter Sprite'], ['Gruul Stampede', 'RootAndRuin', '2026-09-18', 'Sep 18, 2026', '311 views', 'Llanowar Elves'], ['Solar Control', 'NikoPrime', '2026-09-14', 'Sep 14, 2026', '267 views', 'Counterspell'], ['Verdant Reclamation', 'FernAndFable', '2026-09-11', 'Sep 11, 2026', '198 views', 'Cultivate'], ['Steel and Sunrise', 'Dawnkeeper', '2026-09-08', 'Sep 8, 2026', '164 views', 'Swords to Plowshares'], ['Command Tower', 'TabletopTactician', '2026-09-03', 'Sep 3, 2026', '129 views', 'Sol Ring']];

function PublicDecksPage() {
  const [query, setQuery] = useState('');
  const images = useScryfallImages(publicDecks.map((deck) => ({ cardName: deck[5] })));
  const visibleDecks = publicDecks.filter((deck) => deck.join(' ').toLowerCase().includes(query.toLowerCase()));
  return <Layout footerText="Share your brewing discoveries with the table"><main><div className="intro"><div><p className="eyebrow">The community shelf</p><h2>Find a list worth testing.</h2><p>Browse public decklists from fellow players, inspect their game plan, and save a copy to your own workshop.</p></div><img className="hero-image" src={imageUrl('publicDecks.png')} alt="Public Magic: The Gathering decks" /></div><section aria-labelledby="featured-title"><div className="section-toolbar"><h3 id="featured-title">Most Popular Decks</h3><form className="deck-search" role="search" onSubmit={(event) => event.preventDefault()}><label htmlFor="public-deck-search">Search public decks</label><input id="public-deck-search" type="search" placeholder="Search decks or players" value={query} onChange={(event) => setQuery(event.target.value)} /></form></div><div className="public-deck-list">{visibleDecks.map((deck) => <article className="public-deck-row" key={deck[0]} style={images[deck[5]] ? { backgroundImage: `url('${images[deck[5]]}')` } : undefined}><h4>{deck[0]}</h4><span className="deck-publisher">{deck[1]}</span><time dateTime={deck[2]}>{deck[3]}</time><span>{deck[4]}</span><button type="button">View deck</button></article>)}</div></section></main></Layout>;
}

const builderCards = [{ name: 'Snapcaster Mage', count: 2, mana: 2, color: 'blue', type: 'creature' }, { name: 'Delver of Secrets', count: 4, mana: 1, color: 'blue', type: 'creature' }, { name: 'Lightning Bolt', count: 4, mana: 1, color: 'red', type: 'instant' }, { name: 'Opt', count: 4, mana: 1, color: 'blue', type: 'instant' }, { name: 'Counterspell', count: 3, mana: 2, color: 'blue', type: 'instant' }, { name: 'Island', count: 12, mana: 0, color: 'blue', type: 'land' }, { name: 'Mountain', count: 12, mana: 0, color: 'red', type: 'land' }];

function BuilderPage() {
  const navigate = useNavigate();
  const allowed = new URLSearchParams(window.location.search).has('fromDecks') && sessionStorage.getItem('builderAccess') === 'true';
  const [mana, setMana] = useState('none'); const [color, setColor] = useState('all'); const [type, setType] = useState('all');
  const images = useScryfallImages(builderCards.map((card) => card.name));
  useEffect(() => { sessionStorage.removeItem('builderAccess'); if (!allowed) navigate('/personal-decks', { replace: true }); }, [allowed, navigate]);
  const filtered = [...builderCards].filter((card) => (color === 'all' || card.color === color) && (type === 'all' || card.type === type)).sort((a, b) => mana === 'high' ? b.mana - a.mana : mana === 'low' ? a.mana - b.mana : 0);
  if (!allowed) return null;
  return <Layout builder footerText="PDF Decks helps you turn ideas into playable lists."><main className="builder-main"><form className="builder-toolbar" role="search"><label htmlFor="sort-mana">Mana value</label><select id="sort-mana" value={mana} onChange={(event) => setMana(event.target.value)}><option value="none">Any</option><option value="low">Low to high</option><option value="high">High to low</option></select><label htmlFor="sort-color">Color</label><select id="sort-color" value={color} onChange={(event) => setColor(event.target.value)}><option value="all">All colors</option><option value="blue">Blue</option><option value="red">Red</option><option value="colorless">Colorless</option></select><label htmlFor="sort-type">Card type</label><select id="sort-type" value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option><option value="creature">Creature</option><option value="instant">Instant</option><option value="sorcery">Sorcery</option><option value="land">Land</option></select></form><section className="builder-workspace" aria-labelledby="deck-editor-title"><h3 id="deck-editor-title">Deck editor: Izzet Spellcraft</h3><div className="card-groups">{['creature', 'instant', 'land'].map((group) => <section className="card-group" key={group}><h4>{group === 'creature' ? 'Creatures' : group === 'instant' ? 'Instants & Sorceries' : 'Lands'}</h4><ul className="card-list">{filtered.filter((card) => card.type === group).map((card) => <li key={card.name}><span>{card.count}x {card.name}</span>{images[card.name] && <img className="card-image" src={images[card.name]} alt={`${card.name} card image`} loading="lazy" />}</li>)}</ul></section>)}</div><p className="status" aria-live="polite">{Object.keys(images).length === builderCards.length ? 'Card images loaded from Scryfall.' : 'Loading card images...'}</p></section></main></Layout>;
}

export default function App() { return <Routes><Route path="/" element={<HomePage />} /><Route path="/personal-decks" element={<PersonalDecksPage />} /><Route path="/public-decks" element={<PublicDecksPage />} /><Route path="/builder" element={<BuilderPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>; }