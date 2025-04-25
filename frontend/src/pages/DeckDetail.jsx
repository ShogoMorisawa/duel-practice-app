import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function DeckDetail() {
  const { id } = useParams();
  const [deck, setDeck] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/decks/${id}`)
      .then((res) => {
        setDeck(res.data);
        console.log(res.data);
      })
      .catch((err) => console.error("デッキ取得に失敗！", err));
  }, [id]);

  if (!deck) return <div>デッキが見つかりません</div>;

  return (
    <div>
      <h2>{deck.name}</h2>
      <ul>
        {deck.cards.map((card, index) => (
          <li key={index}>{card}</li>
        ))}
      </ul>
    </div>
  );
}

export default DeckDetail;
