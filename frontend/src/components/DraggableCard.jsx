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
  console.log("[DraggableCard] Props:", {
    id,
    name,
    cost,
    isFlipped,
    type,
    zone,
    x,
    y,
    rotation,
    imageUrl,
    deckId,
    cardId,
  });

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

  console.log(
    `[DraggableCard] Rendering card ID: ${id} at Coords: {x: ${x}, y: ${y}}, rotation: ${rotation}, zone: ${actualZone}`
  );

  // ドラッグ設定
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: "CARD",
      item: () => {
        // ドラッグ開始時の時間を記録
        dragStartTimeRef.current = Date.now();
        isDraggingRef.current = true;
        console.log("🧪 isDragging", true); // ドラッグ開始時のログ
        console.log("[DEBUG] Drag starting for card:", id, "zone:", actualZone);

        // 実際のDBに存在するcardIdを優先的に使用
        const actualCardId = /^\d+$/.test(cardId) ? cardId : id;

        return {
          id,
          name,
          cost,
          isFlipped,
          x,
          y,
          type: actualZone, // 後方互換性のため
          zone: actualZone, // 新しいプロパティ
          rotation,
          imageUrl, // imageUrlを追加
          deckId,
          cardId: actualCardId, // DBのIDを優先
        };
      },
      end: (item, monitor) => {
        console.log("[DEBUG] Drag ending for card:", id);
        const delta = monitor.getDifferenceFromInitialOffset();
        console.log("[DEBUG] Drag delta:", delta);

        if (delta) {
          const newX = Math.round(initialPos.x + delta.x);
          const newY = Math.round(initialPos.y + delta.y);

          if (onMove) {
            console.log(
              `[DEBUG] Card dragged to new position: {x: ${newX}, y: ${newY}}`
            );
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
        console.log("🧪 isDragging", false); // ドラッグ終了時のログ
      },
      collect: (monitor) => {
        const dragging = monitor.isDragging();
        console.log("🧪 isDragging (collect)", dragging); // collect時のログ
        return {
          isDragging: dragging,
        };
      },
      options: {
        dropEffect: "move",
        enableMouseEvents: true, // マウスイベントも有効に
        enableTouchEvents: true,
        touchSlop: 0,
        delayTouchStart: 0,
        ignoreContextMenu: true,
        captureDraggingState: true, // ドラッグ状態を確実に捕捉
      },
      // 山札はドラッグ不可
      canDrag: () => {
        const result = actualZone !== "deck";
        console.log(
          "[DEBUG] canDrag for card:",
          id,
          "zone:",
          actualZone,
          "result:",
          result
        );
        return result;
      },
    }),
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

    // デバッグログを追加
    console.log("📱 Manual touch start on:", id, "zone:", actualZone);

    // タッチイベントでの位置取得
    const touch = e.touches[0];
    if (!touch) return;

    // タッチ開始位置とカレントポジションを記録
    touchStartPos.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    currentPos.current = { x, y };

    // タッチ開始時間を記録
    dragStartTimeRef.current = Date.now();
    console.log(
      "📱 Touch start position:",
      touchStartPos.current,
      "at time:",
      dragStartTimeRef.current
    );
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
    console.log("📱 isTap calculation:", {
      deltaX,
      deltaY,
      duration,
      result: isTapEvent,
    });
    return isTapEvent;
  };

  const handleManualDragEnd = (e) => {
    const wasDragging = manualDragging;

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

        // 移動コールバックを呼び出し
        if (onMove) {
          console.log("📱 Manual drag end:", { deltaX, deltaY, newX, newY });
          onMove({
            id,
            x: newX,
            y: newY,
            rotation,
          });
        }
      }

      setManualDragging(false);
      return;
    }

    // タップだったか判定する
    if (isTap(e)) {
      console.log("📱 This was a tap - calling parent onClick with id:", id);
      if (onClick) {
        onClick(id);
        return;
      }
    }

    console.log("📱 Touch end without any action");
  };

  // 回転イベントハンドラ（右クリック）
  const handleRotate = (e) => {
    // 右クリックメニューを防止
    e.preventDefault();

    // 回転処理
    if (onMove) {
      const newRotation = (rotation + 90) % 360;
      console.log(
        `[DEBUG] DraggableCard requesting rotation via right-click: ${rotation} -> ${newRotation}`
      );
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
      console.log("[DEBUG] Ignoring click because card was recently dragged");
      return;
    }

    console.log("[DEBUG] Card clicked (left click) in DraggableCard:", id);

    // 親から渡されたクリックハンドラのみを呼び出す
    // 回転処理は親コンポーネント側で行う
    if (onClick) {
      console.log("[DEBUG] Calling parent onClick with id:", id);
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
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        setManualDragging(true);
        console.log("📱 Starting manual drag based on movement");
      } else {
        return; // 移動量が少なければまだドラッグ開始しない
      }
    }

    // 移動時の新しい位置を計算
    const touch = e.touches[0];
    if (!touch) return;

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

    console.log("📱 Manual drag move:", { deltaX, deltaY, newX, newY });
  };

  return (
    <div
      ref={setCombinedRef}
      style={style}
      onContextMenu={handleRotate}
      onTouchStart={(e) => {
        console.log("📱 Touch start on card:", id, "zone:", actualZone);
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
        console.log("📱 Touch end on card:", id);
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
      // マウスクリック専用ハンドラ（スマホはonTouchEndで処理）
      onClick={(e) => {
        // スマホデバイスでは処理をスキップ（touchendで処理する）
        if ("ontouchstart" in window) {
          console.log("スマホでのclick発火をスキップ");
          return;
        }

        // PCでのクリック処理
        if (isDragging || manualDragging) {
          console.log("クリックをスキップ（ドラッグ中）");
          return;
        }

        console.log("ブラウザのクリックイベントから処理");
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
