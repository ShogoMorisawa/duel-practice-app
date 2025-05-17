import { useState, useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import Card from "./Card";

/**
 * 自由配置できるドラッグ可能なカード
 * @param {Object} props
 * @param {string} props.id カードID
 * @param {string} props.name カード名
 * @param {string} props.cost カードコスト
 * @param {boolean} props.isFlipped 裏向きかどうか
 * @param {string} props.type カードタイプ (後方互換用)
 * @param {string} props.zone カードゾーン (field, hand, deck など)
 * @param {number} props.x X座標
 * @param {number} props.y Y座標
 * @param {number} props.rotation 回転角度
 * @param {function} props.onMove 移動時のコールバック
 * @param {function} props.onClick クリック時のコールバック
 * @param {string} props.imageUrl カードの画像URL (レガシーサポート用)
 * @param {string} props.deckId カードが所属するデッキのID
 * @param {string} props.cardId カードのID（APIエンドポイント用）
 */
const DraggableCard = ({
  id,
  name,
  cost,
  isFlipped,
  type = "default",
  zone,
  x,
  y,
  rotation = 0,
  onMove,
  onClick,
  imageUrl,
  deckId,
  cardId,
}) => {
  // zoneがあればそれを使い、なければtypeを使う移行期コード
  const actualZone = zone || type;

  // ドラッグの検出用
  const isDraggingRef = useRef(false);
  const dragStartTimeRef = useRef(0);

  // 手動ドラッグ用の状態と参照
  const [manualDragging, setManualDragging] = useState(false);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x, y });
  const cardRef = useRef(null);

  // 位置情報のステート管理
  const [initialPos, setInitialPos] = useState({ x, y });

  // propsのx, yが変更されたらステートを更新
  useEffect(() => {
    setInitialPos({ x, y });
    currentPos.current = { x, y };
  }, [x, y]);

  // ドラッグ設定
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: "CARD",
      item: () => {
        // ドラッグ開始時の時間を記録
        dragStartTimeRef.current = Date.now();
        isDraggingRef.current = true;

        // 実際のDBに存在するcardIdを優先的に使用
        const actualCardId = /^\d+$/.test(cardId) ? cardId : id;

        // ドラッグされるアイテムに必要な情報をすべて含める
        const dragItem = {
          id,
          name,
          cost,
          isFlipped,
          x,
          y,
          type: actualZone, // 後方互換性のため
          zone: actualZone, // 新しいプロパティ
          rotation,
          imageUrl, // 画像URLを必ず含める
          deckId, // デッキIDを必ず含める
          cardId: actualCardId, // DBのIDを優先
        };

        return dragItem;
      },
      end: (item, monitor) => {
        const delta = monitor.getDifferenceFromInitialOffset();

        if (delta) {
          const newX = Math.round(initialPos.x + delta.x);
          const newY = Math.round(initialPos.y + delta.y);

          if (onMove) {
            onMove({
              id,
              x: newX,
              y: newY,
              rotation,
            });
          }
        }

        // フラグをすぐにリセット
        isDraggingRef.current = false;
      },
      collect: (monitor) => {
        const dragging = monitor.isDragging();
        return {
          isDragging: dragging,
        };
      },
      options: {
        dropEffect: "move",
        enableMouseEvents: true, // マウスによるドラッグを有効に
        enableTouchEvents: true, // タッチによるドラッグを有効に
        touchSlop: 0, // タッチの許容範囲を0に設定
        delayTouchStart: 0, // タッチ開始の遅延を0に設定
        ignoreContextMenu: true, // ドラッグ中の右クリックによるコンテキストメニューを無視
        captureDraggingState: true, // ドラッグ状態を確実に捕捉
      },
      // 山札はドラッグ不可
      canDrag: () => {
        const result = actualZone !== "deck";
        return result;
      },
    }),
    // 依存配列 最新のカード情報に更新
    [
      id,
      name,
      cost,
      isFlipped,
      initialPos.x,
      initialPos.y,
      rotation,
      onMove,
      actualZone,
      imageUrl,
      deckId,
      cardId,
    ]
  );

  // 手動ドラッグハンドラ（TouchBackendの代替）
  const handleManualDragStart = (e) => {
    if (actualZone === "deck") return; // 山札はドラッグ不可

    // ユーザーが触った位置を取得
    const touch = e.touches[0];
    if (!touch) return;

    // タッチ開始位置とカレントポジションを記録
    touchStartPos.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    currentPos.current = { x, y };

    // グローバル変数にもタッチ位置を記録
    if (typeof window !== "undefined") {
      window.lastTouchPosition = {
        x: touch.clientX,
        y: touch.clientY,
      };
    }

    // タッチ開始時間を記録
    dragStartTimeRef.current = Date.now();

    // グローバル変数に現在ドラッグ中のカード情報を格納（スマホ用）
    window.currentDraggedCard = {
      id,
      name,
      cost,
      isFlipped,
      zone: actualZone,
      type: actualZone,
      x,
      y,
      rotation,
      imageUrl,
      deckId,
      cardId: /^\d+$/.test(cardId) ? cardId : id,
    };

    // ドラッグ中フラグを設定
    window.isMobileCardDragging = true;

    // カードを強調表示（視覚的フィードバック）
    if (cardRef.current) {
      cardRef.current.style.boxShadow = "0 0 10px 2px rgba(59, 130, 246, 0.8)";
      cardRef.current.style.zIndex = "9999";
    }
  };

  // 手動ドラッグ移動処理
  const handleManualDragMove = (e) => {
    // すでにドラッグ中なら処理続行、そうでなければドラッグ開始判定
    if (!manualDragging) {
      const touch = e.touches[0];
      if (!touch) return;

      // 開始位置との差分を計算
      const deltaX = touch.clientX - touchStartPos.current.x;
      const deltaY = touch.clientY - touchStartPos.current.y;

      // 移動量が十分あればドラッグ開始
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setManualDragging(true);

        // ドラッグ開始を明示的に設定
        isDraggingRef.current = true;
      } else {
        return; // 移動量が少なければまだドラッグ開始しない
      }
    }

    // 移動時の新しい位置を計算
    const touch = e.touches[0];
    if (!touch) return;

    // グローバル変数に最新のタッチ位置を更新
    if (typeof window !== "undefined") {
      window.lastTouchPosition = {
        x: touch.clientX,
        y: touch.clientY,
      };
    }

    // 移動量を計算
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;

    // カード要素の新しい位置を計算
    const newX = currentPos.current.x + deltaX;
    const newY = currentPos.current.y + deltaY;

    // 表示を更新（実際のDOM操作）
    if (cardRef.current) {
      cardRef.current.style.left = `${newX}px`;
      cardRef.current.style.top = `${newY}px`;
    }

    // 現在の要素がどのエリア上にあるかを確認（手札エリアへのドロップ判定）
    checkDropTarget(touch.clientX, touch.clientY);
  };

  const handleManualDragEnd = (e) => {
    const wasDragging = manualDragging;

    // ドラッグ状態をリセット
    setManualDragging(false);
    isDraggingRef.current = false;

    // カードの見た目をリセット
    if (cardRef.current) {
      cardRef.current.style.boxShadow = "";
      cardRef.current.style.zIndex = "";
    }

    // 手札エリアのホバー状態をリセット
    const handArea = document.querySelector(".hand-area");
    if (handArea) {
      handArea.classList.remove("hand-area-hover");
    }

    // フィールドエリアのホバー状態をリセット
    const fieldArea = document.querySelector(".free-placement-area");
    if (fieldArea) {
      fieldArea.classList.remove("field-area-hover");
    }

    // ドラッグしていた場合はドラッグ終了処理
    if (wasDragging) {
      const touch = e.changedTouches[0];
      if (touch) {
        // 最終的な移動量を計算
        const deltaX = touch.clientX - touchStartPos.current.x;
        const deltaY = touch.clientY - touchStartPos.current.y;

        // 移動先の座標を計算
        const newX = Math.round(currentPos.current.x + deltaX);
        const newY = Math.round(currentPos.current.y + deltaY);

        // 手札からフィールドへのドラッグ処理（スマホ用）
        if (
          actualZone === "hand" &&
          window.lastFieldDropPosition &&
          window.lastFieldDropPosition.isOver
        ) {
          // フィールドエリアの参照を取得
          const fieldArea = document.querySelector(".free-placement-area");
          if (fieldArea) {
            try {
              // フィールドエリアにドロップイベントを手動発火
              const dropEvent = new CustomEvent("mobile-hand-to-field-drop", {
                detail: {
                  cardId: id,
                  cardData: {
                    id,
                    name,
                    cost,
                    isFlipped,
                    zone: actualZone,
                    type: actualZone,
                    imageUrl,
                    deckId,
                    cardId: cardId || id,
                    x: window.lastFieldDropPosition.x,
                    y: window.lastFieldDropPosition.y,
                    rotation: rotation || 0,
                  },
                },
              });
              fieldArea.dispatchEvent(dropEvent);

              // ドロップ成功したので視覚的フィードバック
              const feedback = document.createElement("div");
              feedback.className = "drop-feedback";
              feedback.style.position = "fixed";
              feedback.style.left = `${touch.clientX}px`;
              feedback.style.top = `${touch.clientY}px`;
              feedback.style.width = "20px";
              feedback.style.height = "20px";
              feedback.style.borderRadius = "50%";
              feedback.style.backgroundColor = "rgba(74, 222, 128, 0.6)";
              feedback.style.transform = "translate(-50%, -50%)";
              feedback.style.zIndex = "10000";
              document.body.appendChild(feedback);

              // フィードバックアニメーション
              setTimeout(() => {
                feedback.style.opacity = "0";
                feedback.style.transform = "translate(-50%, -50%) scale(2)";
              }, 10);

              // フィードバック要素を削除
              setTimeout(() => {
                if (feedback.parentNode) {
                  feedback.parentNode.removeChild(feedback);
                }
              }, 500);

              // グローバル変数をリセット
              window.lastFieldDropPosition = null;
              return;
            } catch (err) {
              console.error(
                "📱 Error dispatching hand-to-field drop event:",
                err
              );
            }
          }
        }

        // 手札から手札へのドラッグ処理（スマホ用）
        if (actualZone === "hand") {
          // アニメーションで元の位置に戻す
          if (cardRef.current) {
            cardRef.current.style.transition = "all 0.3s ease-out";
            cardRef.current.style.left = `${initialPos.x}px`;
            cardRef.current.style.top = `${initialPos.y}px`;

            // トランジション終了後にスタイルをリセット
            setTimeout(() => {
              if (cardRef.current) {
                cardRef.current.style.transition = "";
              }
            }, 300);
          }

          // 視覚的フィードバック
          const feedback = document.createElement("div");
          feedback.className = "drop-feedback";
          feedback.style.position = "fixed";
          feedback.style.left = `${touch.clientX}px`;
          feedback.style.top = `${touch.clientY}px`;
          feedback.style.width = "16px";
          feedback.style.height = "16px";
          feedback.style.borderRadius = "50%";
          feedback.style.backgroundColor = "rgba(59, 130, 246, 0.5)";
          feedback.style.transform = "translate(-50%, -50%)";
          feedback.style.zIndex = "10000";
          document.body.appendChild(feedback);

          // フィードバックアニメーション
          setTimeout(() => {
            feedback.style.opacity = "0";
            feedback.style.transform = "translate(-50%, -50%) scale(1.5)";
          }, 10);

          // フィードバック要素を削除
          setTimeout(() => {
            if (feedback.parentNode) {
              feedback.parentNode.removeChild(feedback);
            }
          }, 300);

          // グローバル状態をリセット
          setTimeout(() => {
            window.currentDraggedCard = null;
            window.isMobileCardDragging = false;
          }, 100);

          return;
        }

        // フィールドから手札へのドラッグ処理（スマホ用）
        // 手札エリアへのドロップをチェック
        if (handArea) {
          const handRect = handArea.getBoundingClientRect();

          // 手札エリア上でのドロップを検出
          const isDroppedOnHandArea =
            touch.clientX >= handRect.left &&
            touch.clientX <= handRect.right &&
            touch.clientY >= handRect.top &&
            touch.clientY <= handRect.bottom;

          if (isDroppedOnHandArea) {
            if (actualZone === "field") {
              try {
                // 手動でカスタムイベントを発火して手札エリアに通知
                const dropEvent = new CustomEvent("mobile-card-drop", {
                  detail: {
                    cardId: id,
                    cardData: {
                      id,
                      name,
                      cost,
                      isFlipped,
                      zone: actualZone,
                      type: actualZone,
                      imageUrl,
                      deckId,
                      cardId: cardId || id,
                      rotation: rotation || 0,
                    },
                  },
                });
                handArea.dispatchEvent(dropEvent);

                // ドロップ成功のフィードバック
                const feedback = document.createElement("div");
                feedback.className = "drop-feedback";
                feedback.style.position = "fixed";
                feedback.style.left = `${touch.clientX}px`;
                feedback.style.top = `${touch.clientY}px`;
                feedback.style.width = "16px";
                feedback.style.height = "16px";
                feedback.style.borderRadius = "50%";
                feedback.style.backgroundColor = "rgba(59, 130, 246, 0.5)";
                feedback.style.transform = "translate(-50%, -50%)";
                feedback.style.zIndex = "10000";
                feedback.style.transition = "all 0.3s ease-out";
                document.body.appendChild(feedback);

                // フィードバックアニメーション
                setTimeout(() => {
                  feedback.style.opacity = "0";
                  feedback.style.transform = "translate(-50%, -50%) scale(1.5)";
                }, 10);

                // フィードバック要素を削除
                setTimeout(() => {
                  if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                  }
                }, 500);

                // グローバル変数は維持（HandAreaのイベントリスナーで使用）
                return;
              } catch (err) {
                console.error(
                  "📱 Error dispatching mobile-card-drop event:",
                  err
                );
              }
            }

            // 手動でカスタムイベントを発火して手札エリアに通知
            try {
              const dropEvent = new CustomEvent("mobile-card-drop", {
                detail: {
                  cardId: id,
                  cardData: window.currentDraggedCard,
                },
              });
              handArea.dispatchEvent(dropEvent);

              // ドロップ位置での視覚的フィードバック
              const feedback = document.createElement("div");
              feedback.className = "drop-feedback";
              feedback.style.position = "fixed";
              feedback.style.left = `${touch.clientX}px`;
              feedback.style.top = `${touch.clientY}px`;
              feedback.style.width = "16px";
              feedback.style.height = "16px";
              feedback.style.borderRadius = "50%";
              feedback.style.backgroundColor = "rgba(59, 130, 246, 0.5)";
              feedback.style.transform = "translate(-50%, -50%)";
              feedback.style.zIndex = "10000";
              feedback.style.transition = "all 0.3s ease-out";
              document.body.appendChild(feedback);

              // フィードバックアニメーション
              setTimeout(() => {
                feedback.style.opacity = "0";
                feedback.style.transform = "translate(-50%, -50%) scale(1.5)";
              }, 10);

              // フィードバック要素を削除
              setTimeout(() => {
                if (feedback.parentNode) {
                  feedback.parentNode.removeChild(feedback);
                }
              }, 500);

              // グローバル変数は維持（HandAreaのイベントリスナーで使用）
              return;
            } catch (err) {
              console.error(
                "📱 Error dispatching mobile-card-drop event:",
                err
              );
            }
          }

          // ドロップ状態をリセット
          handArea.classList.remove("hand-area-hover");
        }

        // 手札エリア以外の場所でドロップされた場合は通常の移動処理
        if (onMove) {
          onMove({
            id,
            x: newX,
            y: newY,
            rotation,
          });
        }
      }

      // グローバル変数は少し遅延してクリア
      setTimeout(() => {
        if (window.currentDraggedCard && window.currentDraggedCard.id === id) {
          window.currentDraggedCard = null;
          window.isMobileCardDragging = false;
        }
      }, 300);

      return;
    }

    // タップだったか判定する
    if (isTap(e)) {
      if (onClick) {
        onClick(id);
        return;
      }
    }

    // グローバル変数をすぐにクリア（タップの場合）
    if (window.currentDraggedCard && window.currentDraggedCard.id === id) {
      window.currentDraggedCard = null;
      window.isMobileCardDragging = false;
    }
  };

  // タップとドラッグを区別するためのタップ検出関数
  const isTap = (touchEndEvent) => {
    if (!touchEndEvent.changedTouches[0]) return false;

    const touch = touchEndEvent.changedTouches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;
    const duration = Date.now() - dragStartTimeRef.current;

    // 移動距離が少なく、短時間なら「タップ」と判定
    const isTapEvent =
      Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && duration < 300;
    return isTapEvent;
  };

  // 回転イベントハンドラ（右クリック）
  const handleRotate = (e) => {
    // 右クリックメニューを防止
    e.preventDefault();

    // 回転処理
    if (onMove) {
      const newRotation = (rotation + 90) % 360;
      onMove({
        id,
        x,
        y,
        rotation: newRotation,
      });
    }
  };

  // 通常クリック (左クリック) 処理
  const handleCardClick = () => {
    // ドラッグ中または直後ならクリックイベント発火しない
    if (
      isDraggingRef.current ||
      isDragging ||
      manualDragging ||
      Date.now() - dragStartTimeRef.current < 200
    ) {
      return;
    }

    // 親から渡されたクリックハンドラのみを呼び出す
    // 回転処理は親コンポーネント側で行う
    if (onClick) {
      onClick(id);
    }
  };

  const style = {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    transform: `rotate(${rotation}deg)`,
    opacity: isDragging || manualDragging ? 0.5 : 1,
    cursor: "move",
    zIndex: isDragging || manualDragging ? 1000 : 1,
    transition: isDragging || manualDragging ? "none" : "transform 0.2s",
    touchAction: "none",
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    userSelect: "none",
  };

  // refの結合関数（cardRefとdragRefを統合）
  const setCombinedRef = (element) => {
    cardRef.current = element;
    dragRef(element);
  };

  // ドロップ対象のチェック
  const checkDropTarget = (x, y) => {
    // 手札エリアの要素を取得
    const handArea = document.querySelector(".hand-area");
    if (!handArea) return;

    // 手札エリアの位置を取得
    const handRect = handArea.getBoundingClientRect();

    // 現在のタッチ位置が手札エリア内かどうかを確認
    const isOverHandArea =
      x >= handRect.left &&
      x <= handRect.right &&
      y >= handRect.top &&
      y <= handRect.bottom;

    // 手札エリア上でのホバー状態を視覚的に表示
    if (isOverHandArea) {
      handArea.classList.add("hand-area-hover");
    } else {
      handArea.classList.remove("hand-area-hover");
    }

    // フィールドエリアの要素を取得
    const fieldArea = document.querySelector(".free-placement-area");
    if (!fieldArea) return;

    const fieldRect = fieldArea.getBoundingClientRect();
    const isOverFieldArea =
      x >= fieldRect.left &&
      x <= fieldRect.right &&
      y >= fieldRect.top &&
      y <= fieldRect.bottom;

    // FreePlacementAreaのチェック（手札からフィールドへの移動時）
    if (actualZone === "hand") {
      // フィールドエリア上でのホバー状態を視覚的に表示
      if (isOverFieldArea) {
        fieldArea.classList.add("field-area-hover");

        // フィールド位置を計算して、グローバル変数に格納
        if (typeof window !== "undefined") {
          window.lastFieldDropPosition = {
            x: x - fieldRect.left,
            y: y - fieldRect.top,
            isOver: true,
          };
        }
      } else {
        fieldArea.classList.remove("field-area-hover");
        if (typeof window !== "undefined") {
          window.lastFieldDropPosition = { isOver: false };
        }
      }
    } else if (actualZone === "field") {
      // フィールドからの移動時はフィールドエリアのホバー効果は付けない
      fieldArea.classList.remove("field-area-hover");
    }
  };

  return (
    <div
      ref={setCombinedRef}
      style={style}
      onContextMenu={handleRotate}
      onTouchStart={(e) => {
        if (actualZone !== "deck") {
          // 山札以外のカードはスクロールを防止
          e.stopPropagation();

          // 手動ドラッグ開始
          handleManualDragStart(e);
        }
      }}
      onTouchMove={(e) => {
        if (actualZone !== "deck") {
          // 山札以外のカードはスクロールを防止
          e.stopPropagation();

          // 手動ドラッグ移動
          handleManualDragMove(e);
        }
      }}
      onTouchEnd={(e) => {
        if (actualZone !== "deck") {
          // 山札以外のカードはスクロールを防止
          e.stopPropagation();

          // ドラッグしているかに関わらず、タッチ終了を処理
          // (handleManualDragEnd内で動作を判断)
          handleManualDragEnd(e);
        }
      }}
      className="absolute touch-none select-none"
      draggable={false}
      data-card-id={id}
      // マウスクリック専用ハンドラ（スマホはonTouchEndで処理）
      onClick={(e) => {
        // スマホデバイスでは処理をスキップ（touchendで処理する）
        if ("ontouchstart" in window) {
          return;
        }

        // PCでのクリック処理
        if (isDragging || manualDragging) {
          return;
        }

        handleCardClick();
        e.stopPropagation();
      }}
    >
      <Card
        id={id}
        name={name}
        cost={cost}
        isFlipped={isFlipped}
        type={type}
        zone={actualZone}
        onClick={null}
        draggable={false}
        imageUrl={imageUrl}
        deckId={deckId}
        cardId={cardId}
      />
    </div>
  );
};

export default DraggableCard;
