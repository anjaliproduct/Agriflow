export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export const todayStamp = () =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

export const formatOrderRequest = (order: { produce: string; quantity: number; requestedGrade: string; items?: { produce: string; quantity: number; requestedGrade: string }[] }) =>
  order.items?.length
    ? order.items.map((item) => `${item.quantity} kg ${item.produce}, Grade ${item.requestedGrade}`).join(" + ")
    : `${order.quantity} kg ${order.produce}, Grade ${order.requestedGrade}`;

export const formatOrderProduce = (order: { produce: string; items?: { produce: string }[] }) =>
  order.items?.length ? order.items.map((item) => item.produce).join(", ") : order.produce;

export const formatOrderQuantity = (order: { quantity: number; items?: { quantity: number }[] }) =>
  order.items?.length ? `${order.items.reduce((sum, item) => sum + item.quantity, 0)} kg total` : `${order.quantity} kg`;
