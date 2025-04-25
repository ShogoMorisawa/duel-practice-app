import React, { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

const DeckList = () => {
  const [decks, setDecks] = useState([]);
  const [newDeckName, setNewDeckName] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/decks")
      .then((res) => setDecks(res.data))
      .catch((err) => console.error("デッキ取得に失敗！", err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:3000/api/decks", { name: newDeckName })
      .then((res) => {
        setDecks([...decks, res.data]);
        setNewDeckName("");
      })
      .catch((err) => console.error("デッキ追加に失敗！", err));
  };

  const handleDelete = (id) => {
    axios
      .delete(`http://localhost:3000/api/decks/${id}`)
      .then((res) => {
        setDecks(decks.filter((deck) => deck.id !== id));
      })
      .catch((err) => console.error("デッキ削除に失敗！", err));
  };

  return (
    <div>
      <h1>デッキ一覧</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          placeholder="新しいデッキ名"
        />
        <button type="submit">追加</button>
      </form>
      <ul>
        {decks.map((deck) => (
          <NavLink to={`/decks/${deck.id}`}>
            <li key={deck.id}>
              {deck.name}
              <button onClick={() => handleDelete(deck.id)}>削除</button>
            </li>
          </NavLink>
        ))}
      </ul>
    </div>
  );
};

export default DeckList;
