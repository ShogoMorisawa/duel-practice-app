import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const NewDeckForm = ({ onDeckCreated }) => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/decks", { name });
      navigate("/"); // ← 成功したらトップページへ！
    } catch (error) {
      console.error("Error creating deck:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>デッキ作成</h2>
      <input
        type="text"
        placeholder="デッキ名"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <h3>カード名（40枚）</h3>
      {cards.map((card, index) => (
        <input
          key={index}
          type="text"
          placeholder={`カード ${index + 1}`}
          value={card}
          onChange={(e) => handleCardChange(index, e.target.value)}
        />
      ))}
      <br />
      <button type="submit">デッキを作成</button>
    </form>
  );
};

export default NewDeckForm;
