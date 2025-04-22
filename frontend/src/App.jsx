import { useState } from "react";
import "./App.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import DeckList from "./pages/DeckList";
import NewDeckForm from "./components/NewDeckForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DeckList />} />
        <Route path="/new" element={<NewDeckForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
