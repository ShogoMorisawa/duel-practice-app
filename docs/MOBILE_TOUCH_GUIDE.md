# モバイルタッチ操作最適化ガイド

このプロジェクトでは、モバイルデバイス（スマートフォン、タブレット）でのドラッグ＆ドロップ操作を最適化するために、いくつかの重要な実装が行われています。

## 実装された主な改善点

### 1. タッチ操作の最適化

```css
/* グローバルスタイル */
body {
  touch-action: manipulation; /* ダブルタップズームの無効化 */
}
```

- `Card.jsx`と`DraggableCard.jsx`に`draggable={false}`を追加してデフォルトのドラッグ処理を防止
- `FreePlacementArea`の overflow 設定を`auto`に変更し、スクロールとドラッグの両立を実現

### 2. タップとドラッグの区別

モバイルデバイスではタップとドラッグの区別が難しいため、独自の判定ロジックを実装しています：

```javascript
// DraggableCard.jsx内の実装
const isTap = (touchEndEvent) => {
  const touch = touchEndEvent.changedTouches[0];
  if (!touch) return false;

  // タッチ開始位置との距離を計算
  const deltaX = touch.clientX - touchStartPos.current.x;
  const deltaY = touch.clientY - touchStartPos.current.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // 時間の計算
  const touchDuration = Date.now() - dragStartTimeRef.current;

  // 10px以内かつ300ms以内の操作をタップと判定
  return distance < 10 && touchDuration < 300;
};
```

### 3. 手動ドラッグシステム

React DnD と併用して、モバイル用の手動ドラッグ処理を実装しています：

```javascript
// グローバル変数でドラッグ状態を管理
window.currentDraggedCard = null;
window.isMobileCardDragging = false;

// タッチイベントハンドラ
const handleManualDragStart = (e) => {
  // タッチ開始処理
};

const handleManualDragMove = (e) => {
  // ドラッグ中の処理
  // - カード位置の更新
  // - ドロップターゲットの検出
};

const handleManualDragEnd = (e) => {
  // ドラッグ終了処理
  // - タップかドラッグかの判定
  // - 適切なコールバックの呼び出し
};
```

### 4. 場から手札へのカード移動

手札エリア（HandArea）では、以下の機能を実装してモバイルでのドロップを改善しています：

- 手札エリアでのタッチイベント処理
- カスタムイベント`mobile-card-drop`によるモバイル専用の通知システム
- 手札へのドロップ時のカード情報（特に imageURL、deckId、cardId）の保持

## 問題解決のポイント

1. **ビジュアルフィードバック**:

   - ドラッグ中は視覚的フィードバックを表示
   - 手札領域へのドラッグオーバー時は特別なスタイルを適用

2. **パフォーマンス**:

   - 重い DOM 操作を最小限に抑える
   - `requestAnimationFrame`を使用して滑らかなアニメーション

3. **クロスブラウザ対応**:
   - タッチイベントとマウスイベントの両方をサポート
   - iOS/Android の両方で一貫した動作を保証

## 実装例：タッチドラッグの基本設定

```jsx
// コンポーネントの基本設定
<div
  onTouchStart={handleManualDragStart}
  onTouchMove={handleManualDragMove}
  onTouchEnd={handleManualDragEnd}
  style={{
    touchAction: "none", // タッチアクションを無効化
    WebkitTouchCallout: "none", // コンテキストメニュー無効化
    WebkitUserSelect: "none", // テキスト選択無効化
    userSelect: "none",
  }}
>
  {/* カードの内容 */}
</div>
```

## まとめ

モバイルでのドラッグ＆ドロップは、以下の戦略の組み合わせで実現しています：

1. React DnD の標準機能を活用（デスクトップ向け）
2. 手動タッチイベント処理（モバイル向け）
3. グローバル状態の管理による位置追跡
4. タップ/ドラッグの正確な判別ロジック

これにより、スマートフォンやタブレットでも直感的にカードを操作できるユーザー体験を実現しています。
