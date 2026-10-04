import '../../index/index.css';
import { Link } from 'react-router-dom';
import { Layout } from '../components/SiteLayout.jsx';

function NewsItem({ date, title, text }) { return <article className="news-item"><div className="news-date">{date}</div><div><h4>{title}</h4><p>{text}</p></div></article>; }

export default function HomePage() {
  return <Layout footerText="PDF Decks is the place where ideas become real.">
    <main>
      <section aria-labelledby="author-title"><h2 id="author-title">Noah Sparks</h2><p><a href="https://github.com/Mathsquirrel/startup">View the GitHub repository</a></p></section>
      <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><p className="kicker">A workshop for your next game</p><h2 id="hero-title">Build a deck worth shuffling.</h2><p>PDF Decks is an MTG deckbuilder for brewing lists, finding the right cards, and keeping every idea in one place.</p><div className="hero-actions"><Link className="button" to="/personal-decks">Open My Decks</Link><Link className="text-link" to="/public-decks">Browse public decks</Link></div></div></section>
      <section aria-labelledby="tools-title"><div className="section-heading"><h3 id="tools-title">From first idea to finished list.</h3><p>Everything you need to keep brewing.</p></div><div className="tools"><article className="tool"><span className="tool-number">01 / BUILD</span><h4>Shape the main deck</h4><p>Assemble a list and see the cards as you add them.</p><Link className="text-link" to="/personal-decks">Start a deck</Link></article><article className="tool"><span className="tool-number">02 / DISCOVER</span><h4>Find your next card</h4><p>Search the card pool and explore ideas from other brewers.</p><Link className="text-link" to="/public-decks">See the shelf</Link></article><article className="tool"><span className="tool-number">03 / KEEP</span><h4>Save every version</h4><p>Return to your personal decks whenever inspiration strikes.</p><Link className="text-link" to="/personal-decks">Open my decks</Link></article></div></section>
      <section className="news" aria-labelledby="news-title"><div><p className="kicker">Recent/Upcoming Changes</p><h3 id="news-title">News from the workshop</h3></div><div className="news-list"><NewsItem date="Oct 1, 2026" title="Public decks will open for browsing" text="See what other players are building and find a new direction for your next brew." /><NewsItem date="Sep 24, 2026" title="My Decks gets a cleaner home" text="Saved lists now have a dedicated shelf with account and friend status." /><NewsItem date="Sep 18, 2026" title="Card images now load in the main deck" text="Every card in the builder gets its artwork directly from Scryfall." /></div></section>
    </main>
  </Layout>;
}