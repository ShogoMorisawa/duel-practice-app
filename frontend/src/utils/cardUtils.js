/**
 * カードのゾーン管理に関するユーティリティ関数
 */

/**
 * カードオブジェクト生成関数
 * @param {Object} params カードパラメータ
 * @param {string} params.name カード名
 * @param {string|null} params.cost カードコスト
 * @param {boolean} params.isFlipped 裏向きかどうか
 * @param {string} params.zone カードのゾーン (hand, deck, field など)
 * @param {number} params.x X座標 (fieldゾーンの場合のみ使用)
 * @param {number} params.y Y座標 (fieldゾーンの場合のみ使用)
 * @param {number} params.rotation 回転角度
 * @returns {Object} カードオブジェクト
 */
export const createCard = ({
  name,
  cost = null,
  isFlipped = true,
  zone,
  x = 0,
  y = 0,
  rotation = 0,
}) => {
  return {
    id: `${zone}-${name}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    cost,
    isFlipped,
    rotation,
    // フィールド上のカードのみ座標を持つ
    ...(zone === "field" ? { x, y } : {}),
    zone,
  };
};

/**
 * 特定のゾーンに属するカードを取得
 * @param {Array} cards 全カード配列
 * @param {string} zone 取得するゾーン
 * @returns {Array} 指定ゾーンのカード配列
 */
export const getCardsByZone = (cards, zone) => {
  return cards.filter((card) => card.zone === zone);
};

/**
 * カードをあるゾーンから別のゾーンに移動するアクションをディスパッチ
 * @param {function} dispatch ディスパッチ関数
 * @param {string} actionType アクションタイプ
 * @param {string} cardId カードID
 * @param {string} newZone 新しいゾーン
 * @param {Object} newProps 追加プロパティ
 */
export const moveCardToZone = (
  dispatch,
  actionType,
  cardId,
  newZone,
  newProps = {}
) => {
  dispatch({
    type: actionType,
    payload: { id: cardId, newZone, newProps },
  });
};

/**
 * カードの位置を更新するアクションをディスパッチ
 * @param {function} dispatch ディスパッチ関数
 * @param {string} actionType アクションタイプ
 * @param {string} cardId カードID
 * @param {number} x X座標
 * @param {number} y Y座標
 */
export const updateCardPosition = (dispatch, actionType, cardId, x, y) => {
  dispatch({
    type: actionType,
    payload: { id: cardId, x, y },
  });
};

/**
 * カードを反転するアクションをディスパッチ
 * @param {function} dispatch ディスパッチ関数
 * @param {string} actionType アクションタイプ
 * @param {string} cardId カードID
 */
export const flipCard = (dispatch, actionType, cardId) => {
  dispatch({
    type: actionType,
    payload: { id: cardId },
  });
};

/**
 * カードを回転するアクションをディスパッチ
 * @param {function} dispatch ディスパッチ関数
 * @param {string} actionType アクションタイプ
 * @param {string} cardId カードID
 */
export const rotateCard = (dispatch, actionType, cardId) => {
  dispatch({
    type: actionType,
    payload: { id: cardId },
  });
};
