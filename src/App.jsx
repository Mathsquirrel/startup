import { Navigate, Route, Routes } from 'react-router-dom';
import BuilderPage from '../builder/builder.jsx';
import HomePage from '../index/index.jsx';
import PersonalDecksPage from '../personal-decks/personal-decks.jsx';
import PublicDecksPage from '../public-decks/public-decks.jsx';

export default function App() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/personal-decks" element={<PersonalDecksPage />} />
    <Route path="/public-decks" element={<PublicDecksPage />} />
    <Route path="/builder" element={<BuilderPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
