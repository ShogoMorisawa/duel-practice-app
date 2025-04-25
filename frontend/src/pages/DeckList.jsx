import React, { useEffect, useReducer } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

// アクションタイプを定義
const ACTIONS = {
  SET_DECKS: "set_decks",
  ADD_DECK: "add_deck",
  SET_NEW_DECK_NAME: "set_new_deck_name",
};

// 初期状態を定義
const initialState = {
  decks: [],
  newDeckName: "",
};

// リデューサー関数を定義
function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DECKS:
      return { ...state, decks: action.payload };
    case ACTIONS.ADD_DECK:
      return {
        ...state,
        decks: [...state.decks, action.payload],
        newDeckName: "",
      };
    case ACTIONS.SET_NEW_DECK_NAME:
      return { ...state, newDeckName: action.payload };
    default:
      return state;
  }
}

const DeckList = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/decks")
      .then((res) => dispatch({ type: ACTIONS.SET_DECKS, payload: res.data }))
      .catch((err) => console.error("デッキ取得に失敗！", err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!state.newDeckName.trim()) return; // 空の入力を防止

    axios
      .post("http://localhost:3000/api/decks", { name: state.newDeckName })
      .then((res) => {
        dispatch({ type: ACTIONS.ADD_DECK, payload: res.data });
      })
      .catch((err) => console.error("デッキ追加に失敗！", err));
  };

  const handleDelete = (e, id) => {
    e.preventDefault(); // リンクのクリックイベントを防止
    e.stopPropagation(); // イベントの伝播を防止

    axios
      .delete(`http://localhost:3000/api/decks/${id}`)
      .then(() => {
        dispatch({
          type: ACTIONS.SET_DECKS,
          payload: state.decks.filter((deck) => deck.id !== id),
        });
      })
      .catch((err) => console.error("デッキ削除に失敗！", err));
  };

  return (
    <div>
      <h1>デッキ一覧</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={state.newDeckName}
          onChange={(e) =>
            dispatch({
              type: ACTIONS.SET_NEW_DECK_NAME,
              payload: e.target.value,
            })
          }
          placeholder="新しいデッキ名"
        />
        <button type="submit">追加</button>
      </form>
      <ul>
        {state.decks.map((deck) => (
          <li key={deck.id}>
            <NavLink to={`/decks/${deck.id}`}>{deck.name}</NavLink>
            <button onClick={(e) => handleDelete(e, deck.id)}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DeckList;
