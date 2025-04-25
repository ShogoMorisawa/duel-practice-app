import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function PlayDeck() {
  const { deckId } = useParams();
  const [deck, setDeck] = useState(null);
  const [restDeck, setRestDeck] = useState([]);
  const [hand, setHand] = useState([]);
  const [loading, setLoading] = useState(true);

  // データ取得
  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:3000/api/decks/${deckId}`)
      .then((res) => {
        setDeck(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("デッキ取得に失敗！", err);
        setLoading(false);
      });
  }, [deckId]);

  // deck データが取得できたら初期シャッフル
  useEffect(() => {
    if (deck && deck.cards) {
      // 初期時のみ全カードをシャッフル
      const shuffledDeck = [...deck.cards];
      for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
      }
      setRestDeck(shuffledDeck);
      setHand([]); // 初期時は手札をリセット
    }
  }, [deck]);

  // シャッフル関数
  const shuffleDeck = useCallback(() => {
    if (!deck || !deck.cards) return;

    const shuffledDeck = [...restDeck];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    setRestDeck(shuffledDeck);
  }, [restDeck]);

  // カードを引く関数
  const drawCard = useCallback(() => {
    if (restDeck.length === 0) return;

    const newRestDeck = [...restDeck];
    const card = newRestDeck.pop();
    setRestDeck(newRestDeck);
    setHand((prevHand) => [...prevHand, card]);
  }, [restDeck]);

  if (loading) return <div>ロード中...</div>;
  if (!deck) return <div>デッキが見つかりません</div>;

  return (
    <div>
      <h2>プレイ画面: {deck.name}</h2>
      <div>
        <h3>デッキ構成</h3>
        {deck.cards.map((card, index) => (
          <div key={index}>{card}</div>
        ))}
      </div>
      <button onClick={shuffleDeck}>デッキをシャッフル</button>
      <button onClick={drawCard} disabled={restDeck.length === 0}>
        カードを引く ({restDeck.length})
      </button>
      <div>
        <h3>手札 ({hand.length})</h3>
        <div>
          {hand.map((card, index) => (
            <div key={index}>{card}</div>
          ))}
        </div>
        <h3>残りのデッキ ({restDeck.length})</h3>
        <div>
          {restDeck.map((card, index) => (
            <div key={index}>{card}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlayDeck;
