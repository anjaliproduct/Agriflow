import { create } from "zustand";
import { buyers, farmers, inventory, orders, pickupRuns } from "../data/mockData";
import { CartDraft, Grade, InventoryItem, Order, OrderStatus, Role } from "../types";
import { todayStamp } from "../utils/formatters";

type AppState = {
  role: Role;
  farmers: typeof farmers;
  buyers: typeof buyers;
  inventory: InventoryItem[];
  orders: Order[];
  pickupRuns: typeof pickupRuns;
  logisticsRuns: typeof pickupRuns;
  draft?: CartDraft;
  notice?: string;
  setRole: (role: Role) => void;
  clearNotice: () => void;
  updateInventory: (itemId: string, quantity: number, harvestDate: string, grade: Grade) => void;
  setDraft: (draft: CartDraft) => void;
  placeOrder: () => void;
  advanceOrder: (orderId: string, status: OrderStatus) => void;
  confirmAllocation: (orderId: string) => void;
  schedulePickup: (orderId: string) => void;
  verifyQuality: (orderId: string) => void;
  generateInvoice: (orderId: string) => void;
  releasePayment: (orderId: string) => void;
};

const addActivity = (order: Order, text: string): Order => ({
  ...order,
  activity: [{ at: todayStamp(), text }, ...order.activity],
});

export const useAppStore = create<AppState>((set, get) => ({
  role: "manager",
  farmers,
  buyers,
  inventory,
  orders,
  pickupRuns,
  logisticsRuns: pickupRuns,
  setRole: (role) => set({ role }),
  clearNotice: () => set({ notice: undefined }),
  updateInventory: (itemId, quantity, harvestDate, grade) =>
    set((state) => ({
      inventory: state.inventory.map((item) =>
        item.id === itemId
          ? { ...item, declaredQuantity: quantity, harvestDate, estimatedGrade: grade, lastUpdated: todayStamp() }
          : item,
      ),
      notice: "Declared inventory updated. Final quantity and grade will be verified at collection.",
    })),
  setDraft: (draft) => set({ draft }),
  placeOrder: () => {
    const draft = get().draft;
    if (!draft) return;
    const newOrder: Order = {
      id: `ORD-${1043 + get().orders.length}`,
      buyerId: "b1",
      buyer: "Adam's Grocery",
      produce: draft.produce,
      quantity: draft.quantity,
      requestedGrade: draft.grade,
      deliveryDate: draft.deliveryDate,
      status: "New",
      confidence: draft.quantity > 700 ? "Medium" : "High",
      allocation: [],
      invoiceStatus: "Not Generated",
      paymentStatus: "Pending",
      activity: [{ at: todayStamp(), text: `Buyer placed ${draft.quantity} kg ${draft.produce} order.` }],
    };
    set((state) => ({ orders: [newOrder, ...state.orders], draft: undefined, notice: "Bulk order placed for manager review." }));
  },
  advanceOrder: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((order) => (order.id === orderId ? addActivity({ ...order, status }, `Order moved to ${status}.`) : order)),
      notice: `Order ${status.toLowerCase()}.`,
    })),
  confirmAllocation: (orderId) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? addActivity({ ...order, status: "Allocated" }, "Manager approved farmer allocation. Farmers notified.") : order,
      ),
      notice: "Allocation confirmed and farmers notified.",
    })),
  schedulePickup: (orderId) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? addActivity(
              {
                ...order,
                status: "Pickup Scheduled",
                pickupSchedule: { driver: "Meera Singh", vehicle: "Truck KA-05-2281", route: "East Ridge -> Nandi Road -> Riverbend -> Collection Center", pickupDate: "2026-07-09" },
              },
              "Pickup scheduled and farmer notifications sent.",
            )
          : order,
      ),
      notice: "Pickup schedule created.",
    })),
  verifyQuality: (orderId) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? addActivity({ ...order, status: "Quality Verified", verifiedQuantity: Math.max(order.quantity - 18, 0), verifiedGrade: "A" }, "Collection center verified quantity and grade.")
          : order,
      ),
      notice: "Quality verified at collection center.",
    })),
  generateInvoice: (orderId) =>
    set((state) => ({
      orders: state.orders.map((order) => (order.id === orderId ? addActivity({ ...order, invoiceStatus: "Generated" }, "Buyer invoice generated.") : order)),
      notice: "Buyer invoice generated.",
    })),
  releasePayment: (orderId) =>
    set((state) => ({
      orders: state.orders.map((order) => (order.id === orderId ? addActivity({ ...order, status: "Settled", paymentStatus: "Released" }, "Farmer settlement released and order settled.") : order)),
      notice: "Farmer settlement released.",
    })),
}));
