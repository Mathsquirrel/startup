import { useState } from 'react';
import { Link } from 'react-router-dom';
import './site.css';
import { Layout } from '../src/components/SiteLayout.jsx';
import useScryfallImages from '../src/hooks/useScryfallImages.js';

const savedDecks = [
  ['Izzet Spellcraft', '60 cards', 'Lightning Bolt', 18, 24, 18], ['Forest Floor', '72 cards', 'Opt', 28, 26, 18], ['Draft Collection', '40 cards', 'Counterspell', 8, 24, 28], ["Atraxa's Assembly", '100 cards | Commander', 'Sol Ring', 32, 37, 31], ['Grove of Giants', '100 cards | Commander', 'Cultivate', 36, 38, 26], ['Tidal Conspiracy', '100 cards | Commander', 'Rhystic Study', 24, 35, 41],
];

function DeckDialog({ deck, image, onClose, onShare, onDelete }) {
  const isCreate = !deck[2];
  return <dialog open className="deck-dialog"><button className="modal-close" type="button" aria-label="Close deck details" onClick={onClose}>×</button>{image && <img className="deck-preview-image" src={image} alt={`${deck[0]} featured card`} />}<p className="eyebrow">{isCreate ? 'Start a new list' : 'Deck details'}</p><h2>{deck[0]}</h2><dl className="deck-stats"><div><dt>Creatures</dt><dd>{deck[3]}</dd></div><div><dt>Lands</dt><dd>{deck[4]}</dd></div><div><dt>Spells</dt><dd>{deck[5]}</dd></div></dl><div className="modal-actions"><Link className="modal-action" to="/builder?fromDecks=1" onClick={() => sessionStorage.setItem('builderAccess', 'true')}>{isCreate ? 'Create deck' : 'Edit deck'}</Link>{!isCreate && <><button className="modal-action" type="button" onClick={onShare}>Share</button><button className="modal-action delete-action" type="button" onClick={onDelete}>Delete</button></>}</div></dialog>;
}

export default function PersonalDecksPage() {
  const [selected, setSelected] = useState(null);
  const [decks, setDecks] = useState(savedDecks);
  const images = useScryfallImages(decks.map((deck) => ({ cardName: deck[2] })));
  const close = () => setSelected(null);
  const openBuilder = () => sessionStorage.setItem('builderAccess', 'true');
  const share = async () => { try { await navigator.clipboard.writeText(`${selected[0]} on PDF Decks - ${window.location.href}`); } catch { /* Clipboard can be unavailable in local previews. */ } };
  return <Layout footerText="Your decks, your experiments, your next great game."><main><div className="intro"><div><p className="eyebrow">Your private vault</p><h2>Keep every brew close at hand.</h2><p>Review your saved lists, return to unfinished ideas, and share a deck when it is ready for the table.</p></div></div><section aria-labelledby="saved-title"><h3 id="saved-title">Saved decklists</h3><div className="deck-grid saved-deck-grid">{decks.map((deck) => <button className="deck" key={deck[0]} style={images[deck[2]] ? { backgroundImage: `url('${images[deck[2]]}')` } : undefined} onClick={() => setSelected(deck)}><h4>{deck[0]}</h4><p className="meta">{deck[1]}</p></button>)}<Link className="deck create-deck" to="/builder?fromDecks=1" onClick={openBuilder}><span aria-hidden="true">+</span><h4>Create deck</h4></Link></div></section></main>{selected && <DeckDialog deck={selected} image={images[selected[2]]} onClose={close} onShare={share} onDelete={() => { setDecks((current) => current.filter((deck) => deck[0] !== selected[0])); close(); }} />}</Layout>;
}