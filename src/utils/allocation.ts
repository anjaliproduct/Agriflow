import { Farmer, InventoryItem, Allocation } from "../types";

export function suggestAllocation(
  produce: string,
  requiredQuantity: number,
  farmers: Farmer[],
  inventory: InventoryItem[],
): Allocation[] {
  let remaining = requiredQuantity;
  return inventory
    .filter((item) => item.produce === produce && item.declaredQuantity - item.reservedQuantity > 0)
    .map((item) => {
      const farmer = farmers.find((entry) => entry.id === item.farmerId)!;
      const available = item.declaredQuantity - item.reservedQuantity;
      return { item, farmer, score: farmer.reliability * 2 - farmer.distance + available / 20 };
    })
    .sort((a, b) => b.score - a.score)
    .flatMap(({ item, farmer }) => {
      if (remaining <= 0) return [];
      const quantity = Math.min(item.declaredQuantity - item.reservedQuantity, remaining);
      remaining -= quantity;
      return [
        {
          farmerId: farmer.id,
          farmerName: farmer.name,
          quantity,
          reasons: [
            `${item.declaredQuantity - item.reservedQuantity} kg available after reservations`,
            `${item.freshnessStatus.toLowerCase()} harvest on ${item.harvestDate}`,
            `${farmer.distance} km from collection center`,
            `${farmer.reliability}% reliability score`,
          ],
        },
      ];
    });
}
