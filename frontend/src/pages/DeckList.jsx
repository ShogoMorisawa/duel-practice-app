import React, { useEffect, useState } from "react";
import axios from "axios";

const DeckList = () => {
  const [decks, setDecks] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/decks")
      .then((res) => setDecks(res.data))
      .catch((err) => console.error("デッキ取得に失敗！", err));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">デッキ一覧</h1>
      <ul>
        {decks.map((deck) => (
          <li key={deck.id} className="border-b py-2">
            {deck.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DeckList;
