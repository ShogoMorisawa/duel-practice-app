import { useState, useEffect } from "react";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Header from "./components/Header";
import DeckList from "./pages/DeckList";
import NewDeckForm from "./pages/NewDeckForm";
import DeckDetail from "./pages/DeckDetail";
import PlayDeck from "./pages/PlayDeck";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

// タッチデバイス判定関数
const isTouchDevice = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

function App() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // タッチデバイス判定
    setIsTouch(isTouchDevice());
  }, []);

  return (
    <AuthProvider>
      <DndProvider
        backend={isTouch ? TouchBackend : HTML5Backend}
        options={
          isTouch
            ? {
                enableMouseEvents: true,
                delayTouchStart: 0,
                delayMouseStart: 0,
                touchSlop: 0,
                ignoreContextMenu: true,
                enableKeyboardEvents: true,
                scrollAngleRanges: [{ start: 330, end: 30 }],
              }
            : undefined
        }
      >
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/decks" element={<DeckList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/new" element={<NewDeckForm />} />
              <Route path="/decks/:id" element={<DeckDetail />} />
              <Route path="/decks/guest/:id" element={<DeckDetail />} />
              <Route path="/play/guest/:deckId" element={<PlayDeck />} />
              <Route path="/play/:deckId" element={<PlayDeck />} />
            </Routes>
          </main>
        </div>
      </DndProvider>
    </AuthProvider>
  );
}

export default App;
