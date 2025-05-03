import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import DeckList from "./pages/DeckList";
import NewDeckForm from "./components/NewDeckForm";
import DeckDetail from "./pages/DeckDetail";
import PlayDeck from "./pages/PlayDeck";

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
console.log("isMobile:", isMobile);

function App() {
  return (
    <BrowserRouter>
      <DndProvider
        backend={isMobile ? TouchBackend : HTML5Backend}
        options={
          isMobile
            ? {
                enableMouseEvents: true,
                delayTouchStart: 150,
                delayMouseStart: 150,
                touchSlop: 20,
                ignoreContextMenu: true,
                enableHoverOutsideTarget: true,
                scrollAngleRanges: [
                  { start: 30, end: 150 },
                  { start: 210, end: 330 },
                ],
                enableTouchEvents: true,
                enableKeyboardEvents: true,
                debugPrint: true,
              }
            : undefined
        }
      >
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
