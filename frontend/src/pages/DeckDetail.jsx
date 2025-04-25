import { useEffect, useReducer } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// アクションタイプを定義
const ACTIONS = {
  SET_DECK: "set_deck",
};

// 初期状態を定義
const initialState = {
  deck: null,
};

// リデューサー関数を定義
function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DECK:
      return { ...state, deck: action.payload };
    default:
      return state;
  }
}

function DeckDetail() {
  const { id } = useParams();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/decks/${id}`)
      .then((res) => {
        dispatch({ type: ACTIONS.SET_DECK, payload: res.data });
        console.log(res.data);
      })
      .catch((err) => console.error("デッキ取得に失敗！", err));
  }, [id]);

  if (!state.deck) return <div>デッキが見つかりません</div>;

  return (
    <div>
      <h2>{state.deck.name}</h2>
      <ul>
        {state.deck.cards.map((card, index) => (
          <li key={index}>{card}</li>
        ))}
      </ul>
    </div>
  );
}

export default DeckDetail;
