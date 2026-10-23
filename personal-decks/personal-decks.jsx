import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './personal-decks.css';
import { Layout } from '../src/components/SiteLayout.jsx';
import useScryfallImages from '../src/hooks/useScryfallImages.js';
import { getDeckStats, useDecks } from '../src/context/DeckContext.jsx';

const publishedDecksStorageKey = 'pdf-published-decks';

function DeckDialog({ deck, image, onClose, onShare, onDelete }) {
  const stats = getDeckStats(deck);
  return <dialog open className="deck-dialog"><button className="modal-close" type="button" aria-label="Close deck details" onClick={onClose}>×</button>{image && <img className="deck-preview-image" src={image} alt={`${deck.name} featured card`} />}<p className="eyebrow">Deck details</p><h2>{deck.name}</h2><dl className="deck-stats"><div><dt>Total</dt><dd>{stats.total}</dd></div><div><dt>Creatures</dt><dd>{stats.creatures}</dd></div><div><dt>Lands</dt><dd>{stats.lands}</dd></div><div><dt>Spells</dt><dd>{stats.spells}</dd></div></dl><div className="modal-actions"><Link className="modal-action" to={`/builder?fromDecks=1&deckId=${deck.id}`}>Edit deck</Link><button className="modal-action" type="button" onClick={onShare}>Share</button><button className="modal-action delete-action" type="button" onClick={onDelete}>Delete</button></div></dialog>;
}

export default function PersonalDecksPage() {
  const { decks, deleteDeck } = useDecks();
  const [selected, setSelected] = useState(null);
  const [shareCandidate, setShareCandidate] = useState(null);
  const images = useScryfallImages(decks.flatMap((deck) => deck.cards[0] ? [{ cardName: deck.cards[0].name }] : []));
  useEffect(() => {
    if (!shareCandidate) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [shareCandidate]);
  const share = () => {
    setShareCandidate(selected);
  };
  const publishDeck = () => {
    const username = localStorage.getItem('pdf-username') || 'guest';
    const publishedDeck = {
      id: shareCandidate.id,
      name: shareCandidate.name,
      author: username,
      date: new Date().toISOString(),
      cards: shareCandidate.cards,
    };
    try {
      const stored = localStorage.getItem(publishedDecksStorageKey);
      const publishedDecks = stored ? JSON.parse(stored) : [];
      const nextDecks = publishedDecks.filter((deck) => deck.id !== publishedDeck.id);
      localStorage.setItem(publishedDecksStorageKey, JSON.stringify([...nextDecks, publishedDeck]));
      setShareCandidate(null);
      setSelected(null);
    } catch {
      setShareCandidate(null);
    }
  };
  return <Layout footerText="Your decks, your experiments, your next great game."><main><div className="intro"><div><p className="eyebrow">Your private vault</p><h2>Keep every brew close at hand.</h2><p>Review your saved lists, return to unfinished ideas, and share a deck when it is ready for the table.</p></div></div><section aria-labelledby="saved-title"><h3 id="saved-title">Saved decklists</h3><div className="deck-grid saved-deck-grid">{decks.map((deck) => { const stats = getDeckStats(deck); return <button className="deck" key={deck.id} style={images[deck.cards[0]?.name] ? { backgroundImage: `url('${images[deck.cards[0].name]}')` } : undefined} onClick={() => setSelected(deck)}><h4>{deck.name}</h4><p className="meta">{stats.total} cards · {stats.creatures} creatures · {stats.lands} lands</p></button>; })}<Link className="deck create-deck" to="/builder?fromDecks=1"><span aria-hidden="true">+</span><h4>Create deck</h4><p className="meta">Start with a blank list</p></Link></div></section></main>{selected && <DeckDialog deck={selected} image={images[selected.cards[0]?.name]} onClose={() => setSelected(null)} onShare={share} onDelete={() => { deleteDeck(selected.id); setSelected(null); }} />}{shareCandidate && <div className="share-confirmation-overlay" role="dialog" aria-modal="true" aria-labelledby="share-confirmation-title"><div className="share-confirmation"><p id="share-confirmation-title">Are you sure you want to publish this deck?</p><div className="modal-actions"><button className="modal-action" type="button" onClick={publishDeck}>Yes</button><button className="modal-action" type="button" onClick={() => setShareCandidate(null)}>No</button></div></div></div>}</Layout>;
}
