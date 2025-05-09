import { useState, useEffect } from "react";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import DeckList from "./pages/DeckList";
import NewDeckForm from "./pages/NewDeckForm";
import DeckDetail from "./pages/DeckDetail";
import PlayDeck from "./pages/PlayDeck";
import Login from "./pages/Login";

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return (
    <AuthProvider>
      <DndProvider
        backend={isMobile ? TouchBackend : HTML5Backend}
        options={
          isMobile
            ? {
                enableMouseEvents: true,
                enableTouchEvents: true,
                enableKeyboardEvents: true,
              }
            : undefined
        }
      >
        <Routes>
          <Route path="/" element={<DeckList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/new" element={<NewDeckForm />} />
          <Route path="/decks/:id" element={<DeckDetail />} />
          <Route path="/play/:deckId" element={<PlayDeck />} />
        </Routes>
      </DndProvider>
    </AuthProvider>
  );
}

export default App;
