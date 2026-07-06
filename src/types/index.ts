export type Role = "manager" | "buyer" | "farmer";

export type OrderStatus =
  | "New"
  | "Under Review"
  | "Allocated"
  | "Pickup Scheduled"
  | "Collected"
  | "Quality Verified"
  | "Dispatched"
  | "Delivered"
  | "Settled";

export type Grade = "A" | "B" | "C";

export type Farmer = {
  id: string;
  name: string;
  location: string;
  distance: number;
  reliability: number;
  crops: string[];
  declaredInventory: InventoryItem[];
};

export type InventoryItem = {
  id: string;
  farmerId: string;
  produce: string;
  category: string;
  unit: "kg";
  declaredQuantity: number;
  verifiedQuantity: number;
  reservedQuantity: number;
  harvestDate: string;
  estimatedGrade: Grade;
  verifiedGrade?: Grade;
  freshnessStatus: "Fresh" | "Good" | "Watch";
  qualityEstimate: string;
  lastUpdated: string;
};

export type Buyer = {
  id: string;
  name: string;
  location: string;
  paymentTerms: string;
};

export type Allocation = {
  farmerId: string;
  farmerName: string;
  quantity: number;
  reasons: string[];
};

export type Activity = {
  at: string;
  text: string;
};

export type PickupSchedule = {
  driver: string;
  vehicle: string;
  route: string;
  pickupDate: string;
};

export type PickupRunStatus = "Scheduled" | "In Progress" | "Returning" | "Completed" | "Delayed";

export type PickupStopStatus = "Pending" | "Arrived" | "Loaded" | "Skipped";

export type PickupRun = {
  id: string;
  date: string;
  routeName: string;
  driver: string;
  vehicle: string;
  collectionCenter: string;
  status: PickupRunStatus;
  eta: string;
  linkedOrders: string[];
  stops: {
    id: string;
    farmName: string;
    location: string;
    produce: string;
    quantity: number;
    readyTime: string;
    status: PickupStopStatus;
  }[];
  timeline: {
    time: string;
    event: string;
    status: "Done" | "Current" | "Pending";
  }[];
};

export type Invoice = {
  id: string;
  amount: number;
  status: "Draft" | "Generated" | "Paid";
};

export type Order = {
  id: string;
  buyerId: string;
  buyer: string;
  produce: string;
  quantity: number;
  items?: {
    produce: string;
    quantity: number;
    requestedGrade: Grade;
  }[];
  requestedGrade: Grade;
  deliveryDate: string;
  status: OrderStatus;
  confidence: "High" | "Medium" | "Low";
  allocation: Allocation[];
  pickupSchedule?: PickupSchedule;
  invoiceStatus: "Not Generated" | "Generated" | "Paid";
  paymentStatus: "Pending" | "Received" | "Released";
  verifiedQuantity?: number;
  verifiedGrade?: Grade;
  activity: Activity[];
};

export type CartDraft = {
  produce: string;
  quantity: number;
  grade: Grade;
  deliveryDate: string;
  notes: string;
};
