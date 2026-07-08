import { AlertCircle, BadgePercent, BarChart3, Check, CheckCircle2, ChevronRight, Clock, CreditCard, DollarSign, FileText, GripVertical, Info as InfoIcon, Leaf, MapPin, MessageCircle, Milestone, Pencil, Plus, Receipt, Scale, ShoppingBag, Sparkles, Sprout, Store, Truck, User, Users, Wallet, Warehouse } from "lucide-react";
import RouteMap from "../../components/RouteMap";
import type { LucideIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { OrderStatus } from "../../types";
import { suggestAllocation } from "../../utils/allocation";
import { formatCurrency, formatDate } from "../../utils/formatters";

const steps = ["Allocation", "Confirmation", "Pickup", "Verification", "Dispatch", "Settlement"] as const;
type Step = typeof steps[number];

export default function OrderWorkspace() {
  const { orderId } = useParams();
  const { orders, farmers, inventory, pickupRuns, confirmAllocation, schedulePickup, advanceOrder, verifyQuality, generateInvoice, releasePayment } = useAppStore();
  const order = orders.find((entry) => entry.id === orderId);

  const activeStep = order ? getActiveStep(order.status, order.invoiceStatus, order.paymentStatus) : "Allocation";
  const [pickupBlocked, setPickupBlocked] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [confirmationRevealed, setConfirmationRevealed] = useState(false);

  function activeStepToWizard(s: Step): number {
    if (s === "Allocation" || s === "Confirmation") return 0;
    if (s === "Pickup") return 1;
    if (s === "Verification") return 2;
    if (s === "Dispatch") return 3;
    return 4;
  }

  const [wizardStep, setWizardStep] = useState(() => activeStepToWizard(activeStep));
  const [allocationSubStep, setAllocationSubStep] = useState<0 | 1>(
    activeStep === "Confirmation" ? 1 : 0
  );

  useEffect(() => {
    if (order) {
      const s = getActiveStep(order.status, order.invoiceStatus, order.paymentStatus);
      const mapped = activeStepToWizard(s);
      setWizardStep((current) => Math.max(current, mapped));
      setAllocationSubStep(s === "Confirmation" ? 1 : 0);
    }
  }, [order?.status, order?.invoiceStatus, order?.paymentStatus]);

  useEffect(() => {
    if (allocationSubStep === 1) {
      setConfirmationRevealed(false);
      const t = setTimeout(() => setConfirmationRevealed(true), 2500);
      return () => clearTimeout(t);
    }
  }, [allocationSubStep]);

  const WIZARD_STEPS = ["Allocation & Confirmation", "Schedule Pickup", "Verification", "Dispatch", "Settlement"] as const;
  const activeWizardStep = activeStepToWizard(activeStep);

  if (!order) return <Navigate to="/manager/orders" replace />;

  const pickupRun = pickupRuns.find((run) => run.linkedOrders.includes(order.id));
  const suggested = order.allocation.length ? order.allocation : suggestAllocation(order.produce, order.quantity, farmers, inventory);
  const totalSuggested = suggested.reduce((sum, item) => sum + item.quantity, 0);
  const totalOrderQuantity = getTotalQuantity(order);
  const allocationRows = getAllocationRows({ order, allocations: suggested, farmers, inventory });
  // Farmers treated as confirmed for now; flip to `suggested` when tracking real confirmations
  const pendingFarmers: typeof suggested = [];
  const allConfirmed = pendingFarmers.length === 0;
  const invoiceAmount = totalOrderQuantity * 2.4;
  const payment = getPaymentMeta(invoiceAmount, order.paymentStatus, order.invoiceStatus, order.status);
  const activeStepIndex = steps.indexOf(activeStep);
  const daysToDelivery = Math.ceil((new Date(`${order.deliveryDate}T00:00:00`).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const itemNames = order.items?.length
    ? order.items.length <= 2
      ? order.items.map((i) => i.produce).join(", ")
      : `${order.items[0].produce} +${order.items.length - 1} more`
    : order.produce;
  const orderIndex = orders.indexOf(order);
  const prevOrder = orders[orderIndex - 1];
  const nextOrder = orders[orderIndex + 1];

  const do_ = {
    advanceOrder: (status: OrderStatus) => advanceOrder(order.id, status),
    confirmAllocation: () => confirmAllocation(order.id),
    schedulePickup: () => schedulePickup(order.id),
    verifyQuality: () => verifyQuality(order.id),
    generateInvoice: () => generateInvoice(order.id),
    releasePayment: () => releasePayment(order.id),
  };

  const stepFooters: Partial<Record<Step, React.ReactNode>> = {
    Allocation: (order.status === "New" || order.status === "Under Review") ? (
      <button className="btn-primary" onClick={do_.confirmAllocation}><CheckCircle2 size={15} /> Confirm Allocation</button>
    ) : null,
    Confirmation: order.status === "Allocated" ? (
      <button
        className="btn-primary"
        onClick={() => {
          if (!allConfirmed) { setPickupBlocked(true); return; }
          setPickupBlocked(false);
          do_.schedulePickup();
        }}
      >
        <Truck size={15} /> Schedule Pickup
      </button>
    ) : (
      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
        <CheckCircle2 size={14} className="text-green-500" /> Pickup scheduled
      </span>
    ),
    Pickup: order.status === "Pickup Scheduled" ? (
      <button className="btn-primary" onClick={() => do_.advanceOrder("Collected")}>Mark Collected</button>
    ) : (
      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
        <CheckCircle2 size={14} className="text-green-500" /> Collected
      </span>
    ),
    Verification: order.status === "Collected" ? (
      <button className="btn-primary" onClick={do_.verifyQuality}>Mark as Verified</button>
    ) : (
      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
        <CheckCircle2 size={14} className="text-green-500" /> Verified
      </span>
    ),
    Dispatch: order.status === "Quality Verified" ? (
      <button className="btn-primary" onClick={() => do_.advanceOrder("Dispatched")}>Dispatch Order</button>
    ) : order.status === "Dispatched" ? (
      <button className="btn-primary" onClick={() => do_.advanceOrder("Delivered")}>Mark Delivered</button>
    ) : (
      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
        <CheckCircle2 size={14} className="text-green-500" /> Delivered
      </span>
    ),
    Settlement: order.status !== "Settled" && order.paymentStatus !== "Released" ? (
      <button
        className="btn-primary"
        disabled={!["Delivered"].includes(order.status)}
        onClick={do_.releasePayment}
      >
        Release Payment
      </button>
    ) : (
      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
        <CheckCircle2 size={14} className="text-green-500" /> Payment released
      </span>
    ),
  };

  return (
    <div className="-m-6 flex h-[100dvh] flex-col overflow-hidden bg-white">

      {/* Header */}
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex h-11 items-center gap-2 px-4">
          <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm text-slate-500">
            <Link className="shrink-0 hover:text-slate-900" to="/manager/orders">Orders</Link>
            <ChevronRight size={13} className="shrink-0 text-slate-300" />
            <span className="shrink-0 text-slate-500">{order.id}</span>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setChatOpen((o) => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={chatOpen
                ? { backgroundColor: "#095F25", color: "#ffffff" }
                : { backgroundColor: "#f1f5f9", color: "#475569" }
              }
              aria-label="Toggle order chat"
            >
              <MessageCircle size={15} />
            </button>
            <div className="mx-1 h-4 w-px bg-slate-200" />
            <span className="text-xs text-slate-400">{orderIndex + 1} / {orders.length}</span>
            <Link to={prevOrder ? `/manager/orders/${prevOrder.id}` : "#"} className={`flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${!prevOrder ? "pointer-events-none opacity-30" : "text-slate-500 hover:text-slate-900"}`}>
              <ChevronRight size={14} className="rotate-90" />
            </Link>
            <Link to={nextOrder ? `/manager/orders/${nextOrder.id}` : "#"} className={`flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${!nextOrder ? "pointer-events-none opacity-30" : "text-slate-500 hover:text-slate-900"}`}>
              <ChevronRight size={14} className="-rotate-90" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main — centred, vertically padded */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden items-stretch justify-center px-6 py-6">
        <div className="flex w-full max-w-[860px] flex-col">

          {/* Order title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">{order.buyer}</h1>
            <p className="mt-0.5 text-sm text-slate-400">{formatCurrency(invoiceAmount)} · Delivery by {formatDate(order.deliveryDate)}</p>
          </div>

          {/* Wizard card */}
          <div
            className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white"
            style={{ boxShadow: "0 2px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.03)" }}
          >

            {/* Step content — scrollable */}
            <div className="flex-1 overflow-y-auto px-8 py-8">

              {/* Step heading */}
              <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Stage {wizardStep + 1} of {WIZARD_STEPS.length}
              </p>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-950">
                  {wizardStep === 0
                    ? (allocationSubStep === 0 ? "Allocation" : "Farmer Confirmation")
                    : WIZARD_STEPS[wizardStep]}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {wizardStep === 0 && allocationSubStep === 0 && "Review and approve the suggested farmer allocation for this order. Adjust quantities as needed before confirming."}
                  {wizardStep === 0 && allocationSubStep === 1 && "Waiting on farmers to confirm their supply commitment. Accept the order once all confirmations are in."}
                  {wizardStep === 1 && "Coordinate the farm collection route and assign a driver and vehicle for the pickup run."}
                  {wizardStep === 2 && "Verify the quantity and grade of produce collected at the collection centre against declared amounts."}
                  {wizardStep === 3 && "Dispatch the order to the buyer and track delivery progress to the destination."}
                  {wizardStep === 4 && "Generate the buyer invoice, confirm payment receipt, and release payouts to farmers."}
                </p>
              </div>

              {/* Step 0: Allocation & Confirmation (two sub-steps) */}
              {wizardStep === 0 && (
                <div className="space-y-6">
                  {/* Sub-step 0a: Allocation */}
                  {allocationSubStep === 0 && (
                    <>
                      <AllocationPanel rows={allocationRows} totalSuggested={totalSuggested} requiredQuantity={totalOrderQuantity} />
                      <AllocationRecommendationToggle />
                    </>
                  )}

                  {/* Sub-step 0b: Awaiting Confirmation */}
                  {allocationSubStep === 1 && (
                    <>
                      <div className="w-full divide-y divide-slate-100">
                        {suggested.map((alloc, idx) => {
                          const confirmed = confirmationRevealed;
                          return (
                            <div key={alloc.farmerId} className="flex items-center justify-between py-5">
                              <div className="flex items-center gap-3">
                                <span
                                  className="flex h-9 w-9 shrink-0 items-center justify-center bg-slate-100 text-xs font-semibold text-slate-600"
                                  style={{ borderRadius: 8 }}
                                >
                                  {alloc.farmerName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{alloc.farmerName}</p>
                                  <p className="text-xs text-slate-400">{alloc.quantity} kg · {alloc.produce ?? order.produce}</p>
                                </div>
                              </div>
                              {confirmed ? (
                                <span className="inline-flex w-24 items-center justify-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Confirmed
                                </span>
                              ) : (
                                <span className="inline-flex w-24 items-center justify-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Pending
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 1: Schedule Pickup */}
              {wizardStep === 1 && (
                <div>
                  {pickupRun ? (
                    <div className="mt-4 space-y-4">
                      <RouteMap
                        stops={pickupRun.stops.map((s) => ({ farmName: s.farmName, time: s.readyTime, status: s.status, produce: s.produce, quantity: s.quantity }))}
                        collectionCenter={pickupRun.collectionCenter}
                        eta={pickupRun.eta}
                        height={260}
                      />
                      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                        <PickupRunReference run={pickupRun} />
                        <div className="min-w-[200px]">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Route order</p>
                          <VerticalRouteTimeline run={pickupRun} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4"><PickupRunReference run={undefined} /></div>
                  )}
                </div>
              )}

              {/* Step 2: Verification */}
              {wizardStep === 2 && (
                <div>
                  <div>
                    <VerificationSummary key={order.id} orderStatus={order.status} quantity={order.quantity} verifiedQuantity={order.verifiedQuantity} verifiedGrade={order.verifiedGrade} run={pickupRun} allocations={suggested} allocationRows={allocationRows} inventory={inventory} />
                  </div>
                </div>
              )}

              {/* Step 3: Dispatch */}
              {wizardStep === 3 && (
                <div>
                  <SectionTitle title="Delivery address" description={BUYER_ADDRESSES[order.buyer] ?? order.buyer} />
                  <div className="mt-5">
                    <DeliveryMap orderStatus={order.status} buyer={order.buyer} run={pickupRun} />
                  </div>
                </div>
              )}

              {/* Step 4: Settlement */}
              {wizardStep === 4 && (
                <InvoiceCard
                  order={order}
                  invoiceAmount={invoiceAmount}
                  payment={payment}
                  allocationRows={allocationRows}
                  onOpenInvoice={() => setInvoiceModalOpen(true)}
                  onReleasePayment={do_.releasePayment}
                />
              )}

            </div>

            {/* Bottom — progress bars + nav */}
            <div className="shrink-0 border-t border-slate-100 px-8 pb-6 pt-4">

              {/* Progress bars */}
              <div className="mb-5 flex gap-2">
                {WIZARD_STEPS.map((_, i) => {
                  let bg: string;
                  if (i < wizardStep) {
                    bg = "#1a1a1a";
                  } else if (i === wizardStep && i === 0) {
                    bg = allocationSubStep === 0
                      ? "linear-gradient(to right, #1a1a1a 50%, #e2e8f0 50%)"
                      : "#1a1a1a";
                  } else if (i === wizardStep) {
                    bg = "#1a1a1a";
                  } else {
                    bg = "#e2e8f0";
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => { setWizardStep(i); if (i === 0) setAllocationSubStep(0); }}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: bg }}
                      aria-label={WIZARD_STEPS[i]}
                    />
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 0 && allocationSubStep === 1) {
                      setAllocationSubStep(0);
                    } else {
                      if (wizardStep === 1) setAllocationSubStep(1);
                      setWizardStep((s) => Math.max(0, s - 1));
                    }
                  }}
                  disabled={wizardStep === 0 && allocationSubStep === 0}
                  className="text-sm font-semibold text-slate-700 underline hover:text-slate-900 disabled:opacity-30 disabled:no-underline"
                >
                  Back
                </button>
                {(() => {
                  const advance = () => {
                    if (wizardStep === 0 && allocationSubStep === 0) { setAllocationSubStep(1); }
                    else { setAllocationSubStep(0); setWizardStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1)); }
                  };
                  let label = "Next";
                  let onClick = advance;
                  if (wizardStep === 0 && allocationSubStep === 0) {
                    label = "Confirm Allocation"; onClick = () => { do_.confirmAllocation(); setAllocationSubStep(1); };
                  } else if (wizardStep === 0 && allocationSubStep === 1) {
                    label = "Accept order"; onClick = () => { do_.schedulePickup(); setAllocationSubStep(0); setWizardStep((s) => Math.min(4, s + 1)); };
                  } else if (wizardStep === 1) {
                    label = "Confirm Schedule"; onClick = () => { do_.advanceOrder("Collected"); setWizardStep((s) => Math.min(4, s + 1)); };
                  } else if (wizardStep === 2) {
                    label = "Mark Verified"; onClick = () => { do_.verifyQuality(); setWizardStep((s) => Math.min(4, s + 1)); };
                  } else if (wizardStep === 3) {
                    label = "Dispatch order";
                    onClick = () => { do_.advanceOrder("Dispatched"); setWizardStep((s) => Math.min(4, s + 1)); };
                  }
                  if (wizardStep === WIZARD_STEPS.length - 1) {
                    label = "Close Order"; onClick = () => do_.releasePayment();
                  }
                  return (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors text-center whitespace-nowrap ${wizardStep !== 2 ? "invisible" : ""}`}
                        style={{ borderColor: "#cbd5e1", color: "#64748b" }}
                      >
                        Notify farmers
                      </button>
                      <button
                        type="button"
                        onClick={wizardStep === WIZARD_STEPS.length - 1 ? undefined : onClick}
                        disabled={wizardStep === WIZARD_STEPS.length - 1}
                        className={`w-[180px] rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-colors whitespace-nowrap text-center ${wizardStep === WIZARD_STEPS.length - 1 ? "cursor-not-allowed opacity-40" : ""}`}
                        style={{ backgroundColor: "#095F25" }}
                      >
                        {label}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
        </div>

        {/* Chat panel — shifts layout, not an overlay */}
        {chatOpen && <OrderChat onClose={() => setChatOpen(false)} />}
      </div>

      <InvoiceModal
        open={invoiceModalOpen}
        order={order}
        invoiceAmount={invoiceAmount}
        onConfirm={do_.generateInvoice}
        onClose={() => setInvoiceModalOpen(false)}
      />
    </div>
  );
}


function Metric({ icon: Icon, iconBg, label, sublabel, value, tone = "normal" }: { icon: LucideIcon; iconBg: string; label: string; sublabel?: string; value: string; tone?: "normal" | "caution" | "warn" }) {
  const valueClass = tone === "warn" ? "text-red-600" : tone === "caution" ? "text-amber-600" : "text-slate-950";
  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`truncate text-xs font-medium ${valueClass}`}>{value}</p>
        {sublabel ? <p className="mt-0.5 text-[11px] text-slate-400">{sublabel}</p> : null}
      </div>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-0.5 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function AllocationRecommendationToggle() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex items-start gap-2.5">
        <span className="flex shrink-0 items-center justify-center rounded-lg bg-violet-50" style={{ width: 42, height: 42 }}>
          <Sparkles size={17} className="text-violet-500" />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900">Use Recommended Allocation</p>
          <p className="mt-0.5 text-sm text-slate-500">System-suggested allocation based on availability, quality, and route. Turn off to allocate manually.</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled((v) => !v)}
        className="relative shrink-0 h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none"
        style={{ backgroundColor: enabled ? "#095F25" : "#e2e8f0" }}
      >
        <span
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}

function AllocationPanel({
  rows,
  totalSuggested,
  requiredQuantity,
}: {
  rows: AllocationRow[];
  totalSuggested: number;
  requiredQuantity: number;
}) {
  return (
    <div className="space-y-4">
      <AllocationTable rows={rows} />
      {totalSuggested < requiredQuantity ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Partial fulfillment risk — {requiredQuantity - totalSuggested} kg short. Consider top-up or buyer notification.
        </p>
      ) : null}
    </div>
  );
}

type AllocationRow = {
  farmerId: string;
  farmerName: string;
  produce: string;
  allocated: number;
  available: number;
  quality: RuleSignal;
  distance: RuleSignal;
  reasons: string[];
};

type RuleSignal = {
  label: string;
  tone: "fresh" | "good" | "watch" | "bad";
};

function AllocationTable({ rows }: { rows: AllocationRow[] }) {
  const [addingFarmer, setAddingFarmer] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusCell = (index: number) => {
    const el = inputRefs.current[index];
    if (!el) return;
    el.focus();
    el.select();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <colgroup>
          <col className="w-[200px]" />
          <col className="w-[100px]" />
          <col className="w-[100px]" />
          <col className="w-[100px]" />
          <col className="w-[100px]" />
          <col className="w-[100px]" />
        </colgroup>
        <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
          <tr className="h-9">
            <th className="px-3 text-left font-medium">Farmer</th>
            <th className="px-3 text-left font-medium">Produce</th>
            <th className="pl-5 pr-5 text-right font-medium">Allocated</th>
            <th className="pl-5 pr-5 text-right font-medium">Available</th>
            <th className="pl-[50px] pr-3 text-left font-medium">Quality</th>
            <th className="px-3 text-right font-medium">Distance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.farmerId}-${row.produce}-${index}`} className="group border-b border-slate-100 hover:bg-slate-50/60">
              <td className="px-3 py-0 font-medium text-slate-950">
                <div className="flex h-12 items-center">{row.farmerName}</div>
              </td>
              <td className="px-3 py-0 text-slate-900">
                <div className="flex h-12 items-center">{row.produce}</div>
              </td>
              <td className="p-0">
                <input
                  ref={(el) => { inputRefs.current[index] = el; }}
                  className="h-12 w-full bg-transparent pl-5 pr-5 text-right text-slate-900 outline-none"
                  defaultValue={`${row.allocated} kg`}
                  aria-label={`${row.farmerName} allocated`}
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
                      e.preventDefault();
                      focusCell(index + 1);
                    }
                    if (e.key === "Tab" && e.shiftKey) {
                      e.preventDefault();
                      focusCell(index - 1);
                    }
                    if (e.key === "Escape") e.currentTarget.blur();
                  }}
                />
              </td>
              <td className="pl-5 pr-5 py-0 text-right text-slate-500">
                <div className="flex h-12 items-center justify-end">{row.available} kg</div>
              </td>
              <td className="pl-[50px] pr-3 py-0 text-right">
                <div className="flex h-12 items-center"><RuleIndicator signal={row.quality} /></div>
              </td>
              <td className="px-3 py-0 text-right text-sm text-slate-500">
                <div className="flex h-12 items-center justify-end">{row.distance.label}</div>
              </td>
            </tr>
          ))}
          {addingFarmer ? (
            <tr className="border-b border-slate-100 bg-slate-50">
              <td className="p-0"><input className="h-12 w-full bg-transparent px-4 text-sm outline-none" placeholder="Farmer name" /></td>
              <td className="p-0"><input className="h-12 w-full bg-transparent px-3 text-sm outline-none" placeholder="Produce" /></td>
              <td className="p-0"><input className="h-12 w-full bg-transparent px-3 text-right text-sm font-semibold outline-none" placeholder="kg" /></td>
              <td colSpan={2} />
              <td className="px-3 text-right">
                <button className="text-sm font-medium text-slate-500 hover:text-slate-900" type="button" onClick={() => setAddingFarmer(false)}>Done</button>
              </td>
            </tr>
          ) : null}
          <tr className="h-11">
            <td colSpan={6} className="px-3">
              <button
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-900"
                type="button"
                onClick={() => setAddingFarmer(true)}
              >
                <Plus size={15} /> Add farmer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RuleIndicator({ signal }: { signal: RuleSignal }) {
  const dotClass =
    signal.tone === "fresh" ? "bg-green-800"
    : signal.tone === "good" ? "bg-green-500"
    : signal.tone === "watch" ? "bg-amber-400"
    : "bg-red-500";
  return (
    <span className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap text-xs font-medium text-slate-500">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {signal.label}
    </span>
  );
}

function ConfirmationTable({ allocations, confirmed }: { allocations: ReturnType<typeof suggestAllocation>; confirmed: boolean }) {
  return (
    <div className="-mx-5 border-y border-slate-100">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-100 bg-slate-50">
          <tr className="h-9">
            <th className="px-4 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Farmer</th>
            <th className="px-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((allocation) => (
            <tr key={allocation.farmerId} className="h-12 border-b border-slate-100 last:border-0">
              <td className="px-4 font-medium text-slate-950">{allocation.farmerName}</td>
              <td className="px-3 text-right">
                {confirmed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Confirmed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Pending
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PickupRunReference({ run }: { run: ReturnType<typeof useAppStore.getState>["pickupRuns"][number] | undefined }) {
  const [fields, setFields] = useState(() => run
    ? { driver: run.driver, vehicle: run.vehicle, date: run.date, timeWindow: `${run.stops[0]?.readyTime ?? "7:00 AM"} – ${run.eta}` }
    : { driver: "", vehicle: "", date: "", timeWindow: "" }
  );

  if (!run) return <p className="text-sm text-slate-400">No pickup run linked yet.</p>;

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      {/* Header: run ID + status + edit button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <p className="text-base font-semibold text-slate-950">{run.id}</p>
          <StatusBadge status={run.status} />
        </div>
        <Link
          to={`/manager/pickup-runs/${run.id}`}
          className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700"
        >
          <Pencil size={11} /> Edit details
        </Link>
      </div>

      {/* Inline-editable fields — no layout shift */}
      <div className="mt-3 grid gap-x-6 gap-y-0 sm:grid-cols-2">
        <InlineField label="Driver" value={fields.driver} onChange={set("driver")} />
        <InlineField label="Vehicle" value={fields.vehicle} onChange={set("vehicle")} />
        <InlineField label="Date" value={fields.date} onChange={set("date")} type="date" />
        <InlineField label="Time window" value={fields.timeWindow} onChange={set("timeWindow")} placeholder="e.g. 7:00 AM – 3:00 PM" />
      </div>
    </div>
  );
}

function InlineField({ label, value, onChange, type = "text", placeholder }: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? "—"}
        className="mt-0.5 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-300 hover:bg-slate-50 focus:bg-slate-50 rounded px-1 -mx-1"
      />
    </div>
  );
}

function parseMinutes(time: string) {
  const [timePart, period] = time.split(" ");
  const [h, m] = timePart.split(":").map(Number);
  return (period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h) * 60 + m;
}

function VerticalRouteTimeline({ run }: { run: ReturnType<typeof useAppStore.getState>["pickupRuns"][number] }) {
  const [stops, setStops] = useState(run.stops);
  const dragIndex = useRef<number | null>(null);

  const onDragStart = (i: number) => { dragIndex.current = i; };
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === i) return;
    const next = [...stops];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(i, 0, moved);
    dragIndex.current = i;
    setStops(next);
  };
  const onDragEnd = () => { dragIndex.current = null; };

  const nodes = [
    ...stops.map((stop, i) => ({ label: stop.farmName, time: stop.readyTime, status: stop.status, isFinal: false, index: i })),
    { label: run.collectionCenter, time: run.eta, status: "Final" as const, isFinal: true, index: stops.length },
  ];

  return (
    <div>
      {nodes.map((node, i) => {
        const isLast = i === nodes.length - 1;
        const dotBg = node.isFinal
          ? "bg-leaf text-white"
          : node.status === "Loaded"
            ? "bg-leaf text-white"
            : node.status === "Arrived"
              ? "bg-amber-400 text-white"
              : "bg-slate-100 text-slate-400";

        return (
          <div
            key={node.label + i}
            className="flex gap-0"
            draggable={!node.isFinal}
            onDragStart={!node.isFinal ? () => onDragStart(i) : undefined}
            onDragOver={!node.isFinal ? (e) => onDragOver(e, i) : undefined}
            onDragEnd={onDragEnd}
          >
            {/* Drag handle */}
            <div className="flex w-5 flex-col items-center pt-1">
              {!node.isFinal ? (
                <GripVertical size={12} className="cursor-grab text-slate-300 active:cursor-grabbing" />
              ) : <div className="w-3" />}
            </div>

            {/* Dot + connector */}
            <div className="flex flex-col items-center" style={{ width: 24 }}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${dotBg}`}>
                {node.isFinal ? "★" : node.status === "Loaded" ? <Check size={11} strokeWidth={3} /> : i + 1}
              </span>
              {!isLast ? <div className="w-px flex-1 bg-slate-200" style={{ minHeight: 32 }} /> : null}
            </div>

            {/* Time + label */}
            <div className={`flex min-w-0 flex-col ${!isLast ? "pb-4" : ""}`} style={{ paddingTop: 3 }}>
              <div className="flex items-center gap-2 pl-2">
                <span className="text-xs font-semibold tabular-nums text-slate-400">{node.time}</span>
                <span className={`text-sm font-semibold ${node.isFinal ? "text-leaf" : "text-slate-900"}`}>{node.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VerificationSummary({ orderStatus, verifiedQuantity, verifiedGrade, run, allocations, allocationRows, inventory }: {
  orderStatus: OrderStatus;
  quantity: number;
  verifiedQuantity?: number;
  verifiedGrade?: string;
  run: ReturnType<typeof useAppStore.getState>["pickupRuns"][number] | undefined;
  allocations: ReturnType<typeof suggestAllocation>;
  allocationRows: AllocationRow[];
  inventory: ReturnType<typeof useAppStore.getState>["inventory"];
}) {
  const isVerified = ["Quality Verified", "Dispatched", "Delivered", "Settled"].includes(orderStatus);

  const initialRows = allocations.map((alloc, idx) => {
    const stop = run?.stops.find((s) => s.farmName === alloc.farmerName);
    const inv = inventory.find((i) => i.farmerId === alloc.farmerId);
    const row = allocationRows.find((r) => r.farmerId === alloc.farmerId);
    const requestedGrade = inv?.estimatedGrade ?? "A";
    const declared = alloc.quantity;
    const verifiedQtyNum =
      stop?.quantity != null ? stop.quantity
      : idx % 3 === 0 ? declared
      : idx % 3 === 1 ? declared - Math.max(1, Math.floor(declared * 0.04))
      : declared + Math.max(1, Math.floor(declared * 0.03));
    const verifiedGradeVal = inv?.verifiedGrade ?? verifiedGrade ?? requestedGrade;
    const diff = verifiedQtyNum - declared;
    const remarks =
      diff === 0 ? "Complete"
      : diff > 0 ? `${diff} excess`
      : `${Math.abs(diff)} missing`;
    return {
      farmer: alloc.farmerName,
      produce: row?.produce ?? stop?.produce ?? "—",
      declaredQty: declared,
      requestedGrade,
      verifiedQty: String(verifiedQtyNum),
      verifiedGrade: verifiedGradeVal,
      remarks,
    };
  });

  const [rows, setRows] = useState(initialRows);

  const setCell = (i: number, field: "declaredQty" | "verifiedQty" | "requestedGrade" | "verifiedGrade", value: string) =>
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: field === "declaredQty" ? (Number(value) || r.declaredQty) : value } : r));

  return (
    <div className="w-full">
      {/* List header */}
      <div className="flex items-center justify-between rounded-lg px-3 py-2 mb-1 bg-green-50">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Farmer</span>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Quantity</span>
            <InfoIcon size={11} className="text-slate-400" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Grade</span>
            <InfoIcon size={11} className="text-slate-400" />
          </div>
          <span className="inline-flex w-28 justify-center text-[11px] font-medium uppercase tracking-wide text-slate-400">Remarks</span>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-5">
          {/* Left: avatar + name + produce */}
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-slate-100 text-xs font-semibold text-slate-600" style={{ borderRadius: 8 }}>
              {row.farmer.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900">{row.farmer}</p>
              <p className="text-xs text-slate-400">{row.produce}</p>
            </div>
          </div>

          {/* Right: Quantity + Grade */}
          <div className="flex items-center gap-8">
            <div className="flex items-center">
              <div className="flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={row.verifiedQty}
                  onChange={(e) => setCell(i, "verifiedQty", e.target.value)}
                  placeholder="—"
                  className="w-10 bg-transparent text-right text-sm font-medium tabular-nums text-slate-900 outline-none placeholder:text-slate-300"
                />
                <span className="mx-1 text-slate-300">/</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(row.declaredQty)}
                  onChange={(e) => setCell(i, "declaredQty", e.target.value)}
                  placeholder="—"
                  className="w-7 bg-transparent text-sm tabular-nums text-slate-400 outline-none placeholder:text-slate-300"
                />
                <span className="ml-1 text-sm text-slate-400">kg</span>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="text"
                value={row.verifiedGrade}
                onChange={(e) => setCell(i, "verifiedGrade", e.target.value)}
                placeholder="—"
                className="w-4 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-300"
              />
              <span className="mx-1 text-slate-300">/</span>
              <input
                type="text"
                value={row.requestedGrade}
                onChange={(e) => setCell(i, "requestedGrade", e.target.value)}
                placeholder="—"
                className="w-4 bg-transparent text-sm text-slate-400 outline-none placeholder:text-slate-300"
              />
            </div>
            {(() => {
              const isComplete = row.remarks === "Complete";
              const isMissing = row.remarks.includes("missing");
              const borderClass = isComplete ? "border-green-400" : isMissing ? "border-amber-400" : "border-blue-400";
              const dotClass = isComplete ? "bg-green-500" : isMissing ? "bg-amber-400" : "bg-blue-400";
              return (
                <span className={`inline-flex w-28 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-slate-600 ${borderClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                  {row.remarks}
                </span>
              );
            })()}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

// Delivery addresses for known buyers — in a real system this comes from the buyer profile
const BUYER_COORDS: Record<string, [number, number]> = {
  "Adam's Grocery":          [12.9716, 77.5946],
  "FreshMart Distribution":  [13.0674, 77.5939],
  "Garden Table Restaurant": [12.9698, 77.5986],
  "City Basket Retail":      [12.9762, 77.5929],
};

const BUYER_ADDRESSES: Record<string, string> = {
  "Adam's Grocery":          "14, MG Road, Downtown Market, Bangalore — 560001",
  "FreshMart Distribution":  "North Hub Logistics Park, Hebbal, Bangalore — 560024",
  "Garden Table Restaurant": "Riverside Promenade, Indiranagar, Bangalore — 560038",
  "City Basket Retail":      "Central Warehouse, Yeshwanthpur, Bangalore — 560022",
};

function DeliveryMap({ orderStatus, buyer, run }: {
  orderStatus: OrderStatus;
  buyer: string;
  run: ReturnType<typeof useAppStore.getState>["pickupRuns"][number] | undefined;
}) {
  const isDispatched = ["Dispatched", "Delivered"].includes(orderStatus);
  const isDelivered = orderStatus === "Delivered";

  const dispatchDate = run ? `${formatShortDate(run.date)} · ${run.eta}` : "—";

  const deliveryStatus = run?.status === "Delayed" ? "Delayed" : isDelivered ? "Ahead of time" : "On-time";
  const deliveryStatusStyle =
    deliveryStatus === "Delayed" ? "bg-orange-50 text-orange-600" :
    deliveryStatus === "Ahead of time" ? "bg-green-100 text-green-800" :
    "bg-green-50 text-green-600";

  return (
    <div className="space-y-4">
      {/* Route headline */}
      <div className="flex items-center">
        <div className="shrink-0">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <Warehouse size={17} className="text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-950">{run?.collectionCenter ?? "Collection Centre"}</p>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <span>Dispatch: {dispatchDate}</span>
            <button type="button" className="rounded p-0.5 hover:bg-slate-100 hover:text-slate-600">
              <Pencil size={10} />
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-1 px-3">
          <div className="h-px flex-1 bg-slate-200" />
          <Truck size={13} className={isDispatched ? "text-leaf" : "text-slate-300"} />
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="shrink-0">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <Store size={17} className="text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-950">{buyer}</p>
          <p className="mt-0.5 text-xs text-slate-400">{isDelivered ? "Delivered ✓" : `ETA: ${dispatchDate}`}</p>
        </div>
      </div>

      {/* Run + driver */}
      <div className="flex justify-between border-t border-slate-100 pt-4 mt-1">
        <Info label="Run" value={run?.id ?? "—"} />
        <Info label="Driver" value={run?.driver ?? "—"} />
        <Info label="Vehicle" value={run?.vehicle ?? "—"} />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Status</p>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${deliveryStatusStyle}`}>{deliveryStatus}</span>
        </div>
      </div>
    </div>
  );
}

function InvoiceCard({
  order,
  invoiceAmount,
  payment,
  allocationRows,
  onOpenInvoice,
  onReleasePayment,
}: {
  order: ReturnType<typeof useAppStore.getState>["orders"][number];
  invoiceAmount: number;
  payment: ReturnType<typeof getPaymentMeta>;
  allocationRows: AllocationRow[];
  onOpenInvoice: () => void;
  onReleasePayment: () => void;
}) {
  const isDelivered = ["Delivered", "Settled"].includes(order.status) || order.paymentStatus === "Released";
  const settled = order.status === "Settled" || order.paymentStatus === "Released";

  const deliveryStatusLabel = settled ? "Settled" : isDelivered ? "Delivered" : order.status === "Dispatched" ? "In Transit" : "Pending";
  const deliveryStatusStyle = settled
    ? "bg-green-100 text-green-800"
    : isDelivered
      ? "bg-green-50 text-green-600"
      : "bg-slate-100 text-slate-500";

  const totalQty = allocationRows.reduce((s, r) => s + r.allocated, 0);
  const ratePerKg = totalQty > 0 ? invoiceAmount / totalQty : 0;
  const logisticsPerRow = allocationRows.length > 0 ? payment.logisticsCharge / allocationRows.length : 0;
  const farmerRows = allocationRows.map((r) => {
    const gross = r.allocated * ratePerKg;
    const coopFee = gross * 0.08;
    const net = Math.max(gross - coopFee - logisticsPerRow, 0);
    return { farmer: r.farmerName, produce: r.produce, qty: r.allocated, gross, coopFee, logistics: logisticsPerRow, net };
  });

  const [detailsOpen, setDetailsOpen] = useState(false);

  const buyerPaymentStatus = order.paymentStatus === "Received" || order.paymentStatus === "Released" ? "Received" : "Awaiting";
  const totalCoopFee = farmerRows.reduce((s, r) => s + r.coopFee, 0);
  const totalLogistics = farmerRows.reduce((s, r) => s + r.logistics, 0);
  const totalNet = farmerRows.reduce((s, r) => s + r.net, 0);

  return (
    <>
      <div className="space-y-5">

        {/* Sub-section 1: Buyer's Invoice */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base font-semibold text-slate-700">Buyer's Invoice</p>
            <button type="button" onClick={onOpenInvoice} className="w-[120px] rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors text-center">
              Create Invoice
            </button>
          </div>
          <div className="grid grid-cols-4 gap-y-5">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-400">Order Value</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{formatCurrency(invoiceAmount)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-400">Order Status</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                <p className="text-sm text-slate-900">Delivered</p>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-400">Payment Status</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${buyerPaymentStatus === "Received" ? "bg-green-500" : "bg-amber-400"}`} />
                <p className="text-sm text-slate-900">{buyerPaymentStatus}</p>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-400">Invoice</p>
              {order.invoiceStatus === "Generated" ? (
                <button type="button" onClick={onOpenInvoice} className="mt-1 flex items-center gap-1 text-sm text-leaf hover:underline">
                  <FileText size={12} /> INV-{order.id}
                </button>
              ) : (
                <p className="mt-1 text-sm text-slate-400">—</p>
              )}
            </div>
          </div>
        </div>

        {/* Sub-section 2: Farmer's Payout */}
        <div className="border-t border-slate-100 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-base font-semibold text-slate-700">Farmer's Payout</p>
            <button
              type="button"
              disabled={order.invoiceStatus !== "Generated"}
              onClick={() => setDetailsOpen(true)}
              className={`w-[120px] rounded-lg border py-1.5 text-xs font-medium transition-colors text-center ${order.invoiceStatus === "Generated" ? "border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer" : "border-slate-200 text-slate-300 cursor-not-allowed"}`}
            >
              Make Payment
            </button>
          </div>
          <div className="grid grid-cols-4 gap-y-5">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-400">Net Payout</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{order.invoiceStatus === "Generated" ? formatCurrency(totalNet) : "—"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-400">Allocated Farmers</p>
              <p className="mt-1 text-sm text-slate-900">5</p>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-400">Coop Fee</p>
              <p className="mt-1 text-sm text-slate-900">{order.invoiceStatus === "Generated" ? formatCurrency(totalCoopFee) : "—"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-400">Logistics</p>
              <p className="mt-1 text-sm text-slate-900">{order.invoiceStatus === "Generated" ? formatCurrency(totalLogistics) : "—"}</p>
            </div>
          </div>
        </div>

      </div>

      <ReleasePaymentModal
        open={detailsOpen}
        allocationRows={allocationRows}
        payment={payment}
        invoiceAmount={invoiceAmount}
        onConfirm={() => { onReleasePayment(); setDetailsOpen(false); }}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  );
}

function ReleasePaymentModal({
  open,
  allocationRows,
  payment,
  invoiceAmount,
  onConfirm,
  onClose,
}: {
  open: boolean;
  allocationRows: AllocationRow[];
  payment: ReturnType<typeof getPaymentMeta>;
  invoiceAmount: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const totalQty = allocationRows.reduce((s, r) => s + r.allocated, 0);
  const ratePerKg = totalQty > 0 ? invoiceAmount / totalQty : 0;
  const coopFeeRate = 0.08;
  const logisticsPerRow = allocationRows.length > 0 ? payment.logisticsCharge / allocationRows.length : 0;

  const rows = allocationRows.map((r) => {
    const gross = r.allocated * ratePerKg;
    const coopFee = gross * coopFeeRate;
    const logistics = logisticsPerRow;
    const net = Math.max(gross - coopFee - logistics, 0);
    return { farmer: r.farmerName, produce: r.produce, qty: r.allocated, gross, coopFee, logistics, net };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">Payment Details</p>
            <p className="mt-0.5 text-xs text-slate-400">Review each farmer's deductions and approve to release payment.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                <th className="pb-2.5 font-medium">Farmer</th>
                <th className="pb-2.5 font-medium">Produce</th>
                <th className="pb-2.5 text-right font-medium">Qty</th>
                <th className="pb-2.5 text-right font-medium">Gross</th>
                <th className="pb-2.5 text-right font-medium">Coop Fee</th>
                <th className="pb-2.5 text-right font-medium">Logistics</th>
                <th className="pb-2.5 text-right font-medium">Net Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.farmer}>
                  <td className="py-2.5 font-medium text-slate-900">{r.farmer}</td>
                  <td className="py-2.5 text-slate-500">{r.produce}</td>
                  <td className="py-2.5 text-right text-slate-500">{r.qty} kg</td>
                  <td className="py-2.5 text-right text-slate-500">{formatCurrency(r.gross)}</td>
                  <td className="py-2.5 text-right text-slate-500">−{formatCurrency(r.coopFee)}</td>
                  <td className="py-2.5 text-right text-slate-500">−{formatCurrency(r.logistics)}</td>
                  <td className="py-2.5 text-right font-semibold text-slate-950">{formatCurrency(r.net)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 text-xs font-medium">
                <td className="py-2.5 pl-0 text-slate-500">Total</td>
                <td />
                <td className="py-2.5 text-right text-slate-600">{rows.reduce((s, r) => s + r.qty, 0)} kg</td>
                <td className="py-2.5 text-right text-slate-600">{formatCurrency(rows.reduce((s, r) => s + r.gross, 0))}</td>
                <td className="py-2.5 text-right text-slate-600">−{formatCurrency(rows.reduce((s, r) => s + r.coopFee, 0))}</td>
                <td className="py-2.5 text-right text-slate-600">−{formatCurrency(rows.reduce((s, r) => s + r.logistics, 0))}</td>
                <td className="py-2.5 text-right font-semibold text-leaf">{formatCurrency(rows.reduce((s, r) => s + r.net, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={onConfirm}>Release Payment</button>
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({
  open,
  order,
  invoiceAmount,
  onConfirm,
  onClose,
}: {
  open: boolean;
  order: ReturnType<typeof useAppStore.getState>["orders"][number];
  invoiceAmount: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  const items = order.items?.length
    ? order.items
    : [{ produce: order.produce, quantity: order.quantity, requestedGrade: order.requestedGrade }];
  const ratePerKg = 2.4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <p className="text-sm font-semibold text-slate-950">Invoice preview</p>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        {/* Invoice body */}
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400">Bill to</p>
              <p className="mt-0.5 text-base font-semibold text-slate-950">{order.buyer}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Invoice</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-950">INV-{order.id}</p>
              <p className="text-xs text-slate-400">{formatDate(new Date().toISOString().slice(0, 10))}</p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 text-right font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Rate</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item) => (
                <tr key={item.produce}>
                  <td className="py-2.5 text-slate-900">{item.produce}</td>
                  <td className="py-2.5 text-right text-slate-500">{item.quantity} kg</td>
                  <td className="py-2.5 text-right text-slate-500">${ratePerKg}/kg</td>
                  <td className="py-2.5 text-right font-medium text-slate-900">{formatCurrency(item.quantity * ratePerKg)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-slate-950">Total</td>
                <td className="pt-3 text-right text-sm font-bold text-slate-950">{formatCurrency(invoiceAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <button className="btn-primary w-full" onClick={() => { onConfirm(); onClose(); }}>
            <FileText size={15} /> Confirm & Send Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentSummary({ invoiceAmount, order, payment }: {
  invoiceAmount: number;
  order: { invoiceStatus: string; paymentStatus: string };
  payment: ReturnType<typeof getPaymentMeta>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Info label="Buyer invoice" value={order.invoiceStatus} />
        <Info label="Buyer amount" value={formatCurrency(invoiceAmount)} />
        <Info label="Buyer payment" value={payment.buyerPayment} />
        <Info label="Farmer payout" value={order.paymentStatus} />
        <Info label="Est. farmer payout" value={formatCurrency(payment.estimatedFarmerPayout)} />
        <Info label="Deductions" value={`${formatCurrency(payment.coopFee)} fee + ${formatCurrency(payment.logisticsCharge)} logistics`} />
      </div>
      <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">{payment.note}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function getStatusLabel(status: OrderStatus, invoiceStatus: string, paymentStatus: string): { label: string; color: string } {
  if (paymentStatus === "Released" || status === "Settled") return { label: "Completed", color: "bg-green-50 text-green-700" };
  if (invoiceStatus === "Generated") return { label: "Invoice sent", color: "bg-blue-50 text-blue-700" };
  if (status === "Delivered") return { label: "Delivered", color: "bg-green-50 text-green-700" };
  if (status === "Dispatched") return { label: "In transit", color: "bg-blue-50 text-blue-700" };
  if (status === "Quality Verified") return { label: "Quality verified", color: "bg-green-50 text-green-700" };
  if (status === "Collected") return { label: "Produce collected", color: "bg-blue-50 text-blue-700" };
  if (status === "Pickup Scheduled") return { label: "Pickup scheduled", color: "bg-blue-50 text-blue-700" };
  if (status === "Allocated") return { label: "Awaiting farmer confirmation", color: "bg-amber-50 text-amber-700" };
  if (status === "Under Review") return { label: "Allocation in progress", color: "bg-amber-50 text-amber-700" };
  return { label: "New order", color: "bg-slate-100 text-slate-600" };
}

function StatusLabel({ status, invoiceStatus, paymentStatus }: { status: OrderStatus; invoiceStatus: string; paymentStatus: string }) {
  const { label, color } = getStatusLabel(status, invoiceStatus, paymentStatus);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function getActiveStep(status: OrderStatus, _invoiceStatus: string, paymentStatus: string): Step {
  if (status === "Settled" || paymentStatus === "Released" || status === "Delivered") return "Settlement";
  if (status === "Dispatched" || status === "Quality Verified") return "Dispatch";
  if (status === "Collected") return "Verification";
  if (status === "Pickup Scheduled") return "Pickup";
  if (status === "Allocated") return "Confirmation";
  return "Allocation";
}

function getTotalQuantity(order: { quantity: number; items?: { quantity: number }[] }) {
  return order.items?.length ? order.items.reduce((sum, item) => sum + item.quantity, 0) : order.quantity;
}


function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`));
}


function getAllocationRows({
  order,
  allocations,
  farmers,
  inventory,
}: {
  order: {
    produce: string;
    quantity: number;
    items?: { produce: string; quantity: number; requestedGrade: string }[];
    deliveryDate: string;
  };
  allocations: ReturnType<typeof suggestAllocation>;
  farmers: ReturnType<typeof useAppStore.getState>["farmers"];
  inventory: ReturnType<typeof useAppStore.getState>["inventory"];
}): AllocationRow[] {
  const orderItems = order.items?.length
    ? order.items
    : [{ produce: order.produce, quantity: order.quantity, requestedGrade: "A" }];
  const remainingByProduce = new Map(orderItems.map((item) => [item.produce, item.quantity]));
  const totalByProduce = new Map(orderItems.map((item) => [item.produce, item.quantity]));

  return allocations.map((allocation) => {
    const produce =
      orderItems.find((item) => (remainingByProduce.get(item.produce) ?? 0) > 0 && allocation.quantity <= (remainingByProduce.get(item.produce) ?? 0))?.produce ??
      orderItems.find((item) => (remainingByProduce.get(item.produce) ?? 0) > 0)?.produce ??
      order.produce;
    remainingByProduce.set(produce, Math.max((remainingByProduce.get(produce) ?? 0) - allocation.quantity, 0));

    const farmer = farmers.find((entry) => entry.id === allocation.farmerId);
    const inventoryItem = inventory.find((item) => item.farmerId === allocation.farmerId && item.produce === produce);
    const available = inventoryItem ? inventoryItem.declaredQuantity - inventoryItem.reservedQuantity : allocation.quantity;
    const grade = inventoryItem?.verifiedGrade ?? inventoryItem?.estimatedGrade;
    const quality: RuleSignal =
      grade === "A" ? { label: "Grade A", tone: "good" }
      : grade === "B" ? { label: "Grade B", tone: "watch" }
      : { label: grade ? `Grade ${grade}` : "Pending", tone: "bad" };
    const distanceKm = farmer?.distance;
    const distance: RuleSignal =
      distanceKm === undefined ? { label: "—", tone: "watch" }
      : distanceKm <= 15 ? { label: `${distanceKm} km`, tone: "good" }
      : distanceKm <= 22 ? { label: `${distanceKm} km`, tone: "watch" }
      : { label: `${distanceKm} km`, tone: "bad" };

    return {
      farmerId: allocation.farmerId,
      farmerName: allocation.farmerName,
      produce,
      allocated: allocation.quantity,
      available: totalByProduce.get(produce) ?? available,
      quality,
      distance,
      reasons: allocation.reasons,
    };
  });
}

function getPaymentMeta(invoiceAmount: number, paymentStatus: string, invoiceStatus: string, orderStatus: string) {
  const coopFee = invoiceAmount * 0.08;
  const logisticsCharge = orderStatus === "New" || orderStatus === "Under Review" ? 0 : 180;
  const qualityAdjustment = ["Quality Verified", "Dispatched", "Delivered", "Settled"].includes(orderStatus) ? 35 : 0;
  const estimatedFarmerPayout = Math.max(invoiceAmount - coopFee - logisticsCharge - qualityAdjustment, 0);
  const buyerPayment =
    paymentStatus === "Received" ? "Received"
    : paymentStatus === "Released" ? "Received and settled"
    : invoiceStatus === "Generated" ? "Awaiting payment"
    : "Not due yet";
  const note =
    orderStatus === "Settled"
      ? "Buyer invoice is closed and farmer settlements have been released."
      : orderStatus === "Delivered"
        ? "Generate the buyer invoice, confirm buyer payment, then release farmer settlements."
        : "Payment values are estimated until delivery and collection centre verification are complete.";

  return { coopFee, logisticsCharge, qualityAdjustment, estimatedFarmerPayout, buyerPayment, note };
}

type ChatMessage = {
  id: number;
  role: "farmer" | "manager" | "buyer";
  name: string;
  text: string;
  time: string;
  resolved?: boolean;
  actions?: { label: string; variant: "primary" | "secondary" }[];
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: "farmer",
    name: "Ravi Kumar",
    text: "FreshMart Buyer; I wanted to flag early. We only have 80 kg of tomatoes ready this week, not the 150 kg on the order. Harvest was shorter than expected.",
    time: "9:14 AM",
    actions: [
      { label: "Accept 80 kg", variant: "secondary" },
      { label: "Reallocate 70 kg", variant: "primary" },
    ],
  },
  {
    id: 3,
    role: "buyer",
    name: "FreshMart Buyer",
    text: "We need the full 150 kg for our weekly supply. Please reallocate the remaining 70 kg from another farm if possible.",
    time: "9:35 AM",
  },
  {
    id: 4,
    role: "manager",
    name: "Manager",
    text: "Got it. I'll source 70 kg from Patel Agro and update the allocation now. Ravi — your confirmed quantity is 80 kg. Thanks.",
    time: "9:41 AM",
    resolved: true,
  },
];

const roleColors: Record<ChatMessage["role"], { dot: string; name: string; bubble: string; text: string; icon: React.ElementType }> = {
  farmer:  { dot: "#16a34a", name: "text-slate-700", bubble: "#f0fdf4", text: "text-slate-800", icon: Leaf        },
  manager: { dot: "#3b82f6", name: "text-slate-700", bubble: "#eff6ff", text: "text-slate-800", icon: User        },
  buyer:   { dot: "#ec4899", name: "text-slate-700", bubble: "#fdf2f8", text: "text-slate-800", icon: ShoppingBag },
};

function OrderChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [issueResolved, setIssueResolved] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "manager", name: "Manager", text, time: new Date().toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" }) },
    ]);
    setDraft("");
  }

  function handleAction(label: string) {
    const text = label === "Reallocate 70 kg"
      ? "Reallocation confirmed — sourcing 70 kg from Patel Agro. Allocation updated."
      : "Accepted 80 kg from Riverbend Farms. Order quantity adjusted accordingly.";
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "manager", name: "Manager", text, time: new Date().toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" }), resolved: true },
    ]);
    setIssueResolved(true);
    // Remove action chips from message 1
    setMessages((prev) => prev.map((m) => m.id === 1 ? { ...m, actions: undefined } : m));
  }

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-slate-100 bg-white">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between bg-white px-5" style={{ borderBottom: "1px solid #ebebeb" }}>
        <p className="text-sm font-semibold text-slate-900">Order Coordination</p>
        <div className="flex items-center">
          {(["farmer", "manager", "buyer"] as const).map((role, i) => {
            const c = roleColors[role];
            const Icon = c.icon;
            return (
              <div
                key={role}
                className="flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white"
                style={{ backgroundColor: c.bubble, color: c.dot, marginLeft: i === 0 ? 0 : -8, zIndex: i }}
              >
                <Icon size={13} />
              </div>
            );
          })}
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-slate-500 ring-2 ring-white"
            style={{ backgroundColor: "#f1f5f9", marginLeft: -8, zIndex: 3 }}
          >
            +3
          </div>
        </div>
      </div>


      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {messages.map((msg) => {
          const c = roleColors[msg.role];
          return (
            <div key={msg.id}>
              {/* Avatar + name row */}
              <div className="mb-1.5 flex items-center gap-2">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: c.bubble, color: c.dot }}
                >
                  <c.icon size={13} />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-slate-800">{msg.name}</span>
                  <span className="text-[10px] text-slate-400">{msg.time}</span>
                </div>
              </div>

              {/* Bubble */}
              <div className="pl-9 space-y-2">
                <div
                  className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs leading-relaxed text-slate-700"
                  style={{ backgroundColor: "#f8fafc", boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)" }}
                >
                  {msg.text}
                </div>

                {/* Action chips */}
                {msg.actions && (
                  <div className="flex gap-2 flex-wrap">
                    {msg.actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => handleAction(action.label)}
                        className="rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors"
                        style={action.variant === "primary"
                          ? { backgroundColor: "#095F25", color: "#fff" }
                          : { backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }
                        }
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </div>
          );
        })}

        {/* System message — issue resolved */}
        {issueResolved && (
          <div className="flex items-center gap-2 py-1">
            <div className="h-px flex-1" style={{ backgroundColor: "#e2e8f0" }} />
            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
              <CheckCircle2 size={11} className="text-green-500" /> Issue marked resolved by system
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: "#e2e8f0" }} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white px-4 py-3" style={{ borderTop: "1px solid #ebebeb" }}>
        <div
          className="flex items-end gap-2 rounded-2xl bg-white px-4 py-3"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #ebebeb" }}
        >
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Send a message…"
            className="flex-1 resize-none bg-transparent text-xs text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim()}
            className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-30"
            style={{ backgroundColor: "#095F25", color: "#fff" }}
          >
            <ChevronRight size={13} className="-rotate-90" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400">Visible to all parties</p>
      </div>
    </aside>
  );
}
