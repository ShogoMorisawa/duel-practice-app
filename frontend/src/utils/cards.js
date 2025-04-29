export const createCard = ({
  name,
  cost = null,
  isFlipped = true,
  zone,
  x = 0,
  y = 0,
  rotation = 0,
}) => ({
  id: `${zone}-${name}-${Math.random().toString(36).substr(2, 9)}`,
  name,
  cost,
  isFlipped,
  rotation,
  ...(zone === "field" ? { x, y } : {}),
  zone,
});
