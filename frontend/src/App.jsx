import { BrowserRouter, Route, Routes } from "react-router-dom";

import DeckList from "./pages/DeckList";
import NewDeckForm from "./components/NewDeckForm";
import DeckDetail from "./pages/DeckDetail";
import PlayDeck from "./pages/PlayDeck";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DeckList />} />
        <Route path="/new" element={<NewDeckForm />} />
        <Route path="/decks/:id" element={<DeckDetail />} />
        <Route path="/play/:deckId" element={<PlayDeck />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
