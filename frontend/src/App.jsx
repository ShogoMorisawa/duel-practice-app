import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import DeckList from "./pages/DeckList";
import NewDeckForm from "./components/NewDeckForm";
import DeckDetail from "./pages/DeckDetail";
import PlayDeck from "./pages/PlayDeck";

function App() {
  return (
    <BrowserRouter>
      <DndProvider backend={HTML5Backend}>
        <Routes>
          <Route path="/" element={<DeckList />} />
          <Route path="/new" element={<NewDeckForm />} />
          <Route path="/decks/:id" element={<DeckDetail />} />
          <Route path="/play/:deckId" element={<PlayDeck />} />
        </Routes>
      </DndProvider>
    </BrowserRouter>
  );
}

export default App;
