import { useState } from "react";
import "./App.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import DeckList from "./pages/DeckList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DeckList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
