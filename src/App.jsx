import { Navigate, Route, Routes } from 'react-router-dom';
import BuilderPage from './pages/BuilderPage.jsx';
import HomePage from './pages/HomePage.jsx';
import PersonalDecksPage from '../personal-decks/PersonalDecksPage.jsx';
import PublicDecksPage from '../public-decks/PublicDecksPage.jsx';

export default function App() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/personal-decks" element={<PersonalDecksPage />} />
    <Route path="/public-decks" element={<PublicDecksPage />} />
    <Route path="/builder" element={<BuilderPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
