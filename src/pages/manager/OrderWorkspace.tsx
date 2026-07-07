import { AlertCircle, Check, CheckCircle2, ChevronDown, ChevronRight, Clock, FileText, GripVertical, Leaf, MapPin, Milestone, MoreHorizontal, Pencil, Plus, Scale, SlidersHorizontal, Sparkles, Sprout, Star, Store, Truck, Wallet, Warehouse } from "lucide-react";
import RouteMap from "../../components/RouteMap";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [expandedStep, setExpandedStep] = useState<Step | null>(activeStep);
  const [pickupBlocked, setPickupBlocked] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  useEffect(() => {
    if (order) setExpandedStep(getActiveStep(order.status, order.invoiceStatus, order.paymentStatus));
  }, [order?.status, order?.invoiceStatus, order?.paymentStatus]);

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
    ) : (
      <button className="btn-secondary" onClick={do_.confirmAllocation}>Re-allocate</button>
    ),
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

  const toggleStep = (step: Step) => setExpandedStep(expandedStep === step ? null : step);

  return (
    <div className="-m-6 flex h-[calc(100vh)] flex-col overflow-hidden bg-slate-50">
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex h-11 items-center gap-2 px-4">
          {/* Brand mark */}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-leaf">
            <Leaf size={11} className="text-white" />
          </span>

          {/* Breadcrumb */}
          <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm text-slate-500">
            <Link className="shrink-0 hover:text-slate-900" to="/manager/orders">Orders</Link>
            <ChevronRight size={13} className="shrink-0 text-slate-300" />
            <span className="shrink-0 text-slate-500">{order.id}</span>
          </nav>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" className="flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              <Star size={14} />
            </button>
            <button type="button" className="flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              <MoreHorizontal size={14} />
            </button>
            <div className="mx-2 h-4 w-px bg-slate-200" />
            <span className="text-xs text-slate-400">{orderIndex + 1} / {orders.length}</span>
            <Link
              to={prevOrder ? `/manager/orders/${prevOrder.id}` : "#"}
              className={`flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${!prevOrder ? "pointer-events-none opacity-30" : "text-slate-500 hover:text-slate-900"}`}
            >
              <ChevronRight size={14} className="rotate-90" />
            </Link>
            <Link
              to={nextOrder ? `/manager/orders/${nextOrder.id}` : "#"}
              className={`flex h-7 w-7 items-center justify-center rounded hover:bg-slate-100 ${!nextOrder ? "pointer-events-none opacity-30" : "text-slate-500 hover:text-slate-900"}`}
            >
              <ChevronRight size={14} className="-rotate-90" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[860px] space-y-4 px-6 py-5">

          {/* Page title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-950">{order.buyer}</h1>
            <p className="mt-1 text-sm text-slate-400">Delivery by {formatDate(order.deliveryDate)} · {order.id}</p>
          </div>

          {/* Global metrics */}
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div className="flex items-stretch divide-x divide-slate-100">
              <Metric icon={Sprout} iconBg="bg-green-50 text-green-600" label="Items" value={itemNames} />
              <Metric icon={Scale} iconBg="bg-blue-50 text-blue-600" label="Quantity" value={`${totalOrderQuantity} kg`} />
              <Metric icon={Wallet} iconBg="bg-amber-50 text-amber-600" label="Order value" value={formatCurrency(invoiceAmount)} />
              <Metric icon={Milestone} iconBg="bg-violet-50 text-violet-600" label="Progress" value={`${Math.round(((activeStepIndex + 1) / steps.length) * 100)}%`} />
              <Metric
                icon={daysToDelivery <= 1 ? Clock : MapPin}
                iconBg={daysToDelivery <= 1 ? "bg-red-50 text-red-500" : daysToDelivery <= 3 ? "bg-orange-50 text-orange-500" : "bg-slate-50 text-slate-500"}
                label="Dispatch"
                value={daysToDelivery > 0 ? `in ${daysToDelivery}d` : daysToDelivery === 0 ? "Today" : "Overdue"}
                tone={daysToDelivery <= 1 ? "warn" : daysToDelivery <= 3 ? "caution" : "normal"}
              />
            </div>
          </div>

          {/* Accordion — separate cards */}
          <div className="space-y-2">
            {steps.map((step, index) => {
              const state: "done" | "active" | "upcoming" =
                index < activeStepIndex ? "done" : index === activeStepIndex ? "active" : "upcoming";
              const isExpanded = expandedStep === step;

              return (
                <AccordionItem
                  key={step}
                  index={index}
                  step={step}
                  state={state}
                  expanded={isExpanded}
                  onToggle={() => toggleStep(step)}
                  footer={stepFooters[step]}
                >
                  {step === "Allocation" ? (
                    <AllocationPanel
                      rows={allocationRows}
                      totalSuggested={totalSuggested}
                      requiredQuantity={totalOrderQuantity}
                    />
                  ) : null}

                  {step === "Confirmation" ? (
                    <div className="space-y-3">
                      {pickupBlocked && pendingFarmers.length > 0 ? (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                          <AlertCircle size={14} className="shrink-0 text-amber-500" />
                          <span>{pendingFarmers.length} of {suggested.length} farmer{suggested.length !== 1 ? "s" : ""} yet to confirm — pickup cannot be scheduled until all respond.</span>
                        </div>
                      ) : null}
                      <ConfirmationTable allocations={suggested} confirmed={order.status !== "Allocated"} />
                    </div>
                  ) : null}

                  {step === "Pickup" ? (
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <SectionTitle title="Coordinate pickup" description="Track the pickup run and farm collection route." />
                        <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                          <Sparkles size={11} /> Auto-scheduled — confirm or adjust
                        </span>
                      </div>
                      {pickupRun ? (
                        <div className="mt-4 space-y-4">
                          <RouteMap
                            stops={pickupRun.stops.map((s) => ({ farmName: s.farmName, time: s.readyTime, status: s.status, produce: s.produce, quantity: s.quantity }))}
                            collectionCenter={pickupRun.collectionCenter}
                            eta={pickupRun.eta}
                            height={300}
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
                  ) : null}

                  {step === "Verification" ? (
                    <div>
                      <SectionTitle title="Collection verification" description="Declared vs collected at the collection centre." />
                      <div className="mt-3">
                        <VerificationSummary key={order.id} orderStatus={order.status} quantity={order.quantity} verifiedQuantity={order.verifiedQuantity} verifiedGrade={order.verifiedGrade} run={pickupRun} allocations={suggested} allocationRows={allocationRows} inventory={inventory} />
                      </div>
                    </div>
                  ) : null}

                  {step === "Dispatch" ? (
                    <div>
                      <SectionTitle title="Delivery Address" description={BUYER_ADDRESSES[order.buyer] ?? order.buyer} />
                      <div className="mt-5">
                        <DeliveryMap orderStatus={order.status} buyer={order.buyer} run={pickupRun} />
                      </div>
                    </div>
                  ) : null}

                  {step === "Settlement" ? (
                    <InvoiceCard
                      order={order}
                      invoiceAmount={invoiceAmount}
                      payment={payment}
                      allocationRows={allocationRows}
                      onOpenInvoice={() => setInvoiceModalOpen(true)}
                      onReleasePayment={do_.releasePayment}
                    />
                  ) : null}
                </AccordionItem>
              );
            })}
          </div>

        </div>
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

function AccordionItem({
  index,
  step,
  state,
  expanded,
  onToggle,
  footer,
  children,
}: {
  index: number;
  step: Step;
  state: "done" | "active" | "upcoming";
  expanded: boolean;
  onToggle: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const cardClass = state === "active"
    ? "rounded-xl border border-slate-300 bg-white shadow-sm"
    : state === "done"
      ? "rounded-xl border border-slate-200 bg-white"
      : "rounded-xl border border-slate-200 bg-white opacity-60";

  return (
    <div className={cardClass}>
      <button
        type="button"
        className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-slate-50/50 rounded-xl"
        onClick={onToggle}
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
          state === "done"
            ? "bg-leaf text-white"
            : state === "active"
              ? "border-2 border-leaf text-leaf"
              : "bg-slate-100 text-slate-400"
        }`}>
          {state === "done" ? <CheckCircle2 size={13} /> : index + 1}
        </span>
        <span className={`flex-1 text-sm font-semibold ${state === "upcoming" ? "text-slate-400" : "text-slate-900"}`}>
          {step}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded ? (
        <div className="border-t border-slate-100 px-5 pb-3 pt-3" style={{ animation: "accordionOpen 180ms ease" }}>
          {children}
          {footer ? (
            <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Metric({ icon: Icon, iconBg, label, sublabel, value, tone = "normal" }: { icon: LucideIcon; iconBg: string; label: string; sublabel?: string; value: string; tone?: "normal" | "caution" | "warn" }) {
  const valueClass = tone === "warn" ? "text-red-600" : tone === "caution" ? "text-amber-600" : "text-slate-950";
  return (
    <div className="flex flex-1 flex-col gap-2.5 px-5 first:pl-0 last:pr-0">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`truncate text-sm font-semibold ${valueClass}`}>{value}</p>
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
      <div className="flex items-start gap-2">
        <SlidersHorizontal size={16} className="mt-0.5 shrink-0 text-leaf" />
        <SectionTitle
          title="Approve suggested allocation"
          description="Rule-based suggestion using quantity available, quality, freshness/FIFO, route distance, and existing commitments."
        />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Sparkles size={11} className="shrink-0" />
        Auto-suggested by rules — review and adjust if needed. You don't need to build this from scratch.
      </div>
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
    <div className="-mx-5 border-y border-slate-100">
      <table className="w-full text-sm">
        <colgroup>
          <col />
          <col className="w-[110px]" />
          <col className="w-[100px]" />
          <col className="w-[100px]" />
          <col className="w-[130px]" />
          <col className="w-[100px]" />
        </colgroup>
        <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
          <tr className="h-9">
            <th className="px-4 text-left font-medium">Farmer</th>
            <th className="px-3 text-left font-medium">Produce</th>
            <th className="px-3 text-right font-medium">Allocated</th>
            <th className="px-3 text-right font-medium">Available</th>
            <th className="px-3 text-left font-medium">Quality</th>
            <th className="px-3 text-right font-medium">Distance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.farmerId}-${row.produce}-${index}`} className="group border-b border-slate-100 hover:bg-slate-50/60">
              <td className="px-4 py-0 font-medium text-slate-950">
                <div className="flex h-12 items-center">{row.farmerName}</div>
              </td>
              <td className="px-3 py-0 text-slate-500">
                <div className="flex h-12 items-center">{row.produce}</div>
              </td>
              <td className="p-0">
                <input
                  ref={(el) => { inputRefs.current[index] = el; }}
                  className="h-12 w-full bg-transparent px-3 text-right font-semibold text-slate-900 outline-none"
                  defaultValue={row.allocated}
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
              <td className="px-3 py-0 text-right text-slate-500">
                <div className="flex h-12 items-center justify-end">{row.available} kg</div>
              </td>
              <td className="px-3 py-0 text-right">
                <div className="flex h-12 items-center"><RuleIndicator signal={row.quality} /></div>
              </td>
              <td className="px-3 py-0 text-right">
                <div className="flex h-12 items-center justify-end"><RuleIndicator signal={row.distance} /></div>
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
            <td colSpan={6} className="px-4">
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
    <span className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap text-xs font-medium text-slate-600">
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

  const initialRows = allocations.map((alloc) => {
    const stop = run?.stops.find((s) => s.farmName === alloc.farmerName);
    const inv = inventory.find((i) => i.farmerId === alloc.farmerId);
    const row = allocationRows.find((r) => r.farmerId === alloc.farmerId);
    const requestedGrade = inv?.estimatedGrade ?? "A";
    // Pre-fill with collection-center data: stop qty if available, else declared qty with small real-world variance
    const verifiedQtyNum = stop?.quantity != null ? stop.quantity : alloc.quantity - Math.floor(alloc.quantity * 0.04);
    const verifiedGradeVal = inv?.verifiedGrade ?? verifiedGrade ?? requestedGrade;
    return {
      farmer: alloc.farmerName,
      produce: row?.produce ?? stop?.produce ?? "—",
      declaredQty: alloc.quantity,
      requestedGrade,
      verifiedQty: String(verifiedQtyNum),
      verifiedGrade: verifiedGradeVal,
    };
  });

  const [rows, setRows] = useState(initialRows);

  const setCell = (i: number, field: "verifiedQty" | "verifiedGrade", value: string) =>
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  return (
    <div className="-mx-5 border-y border-slate-100">
      <table className="w-full text-sm">
        <colgroup>
          <col />
          <col className="w-24" />
          <col className="w-36" />
          <col className="w-32" />
          <col className="w-32" />
        </colgroup>
        <thead className="border-b border-slate-100 bg-slate-50">
          <tr className="h-9">
            <th className="px-4 text-left text-xs font-medium text-slate-400">Farmer</th>
            <th className="px-3 text-left text-xs font-medium text-slate-400">Produce</th>
            <th className="px-3 text-left text-xs font-medium text-slate-400">Required</th>
            <th className="px-3 text-left text-xs font-medium text-slate-400">Verified Qty</th>
            <th className="px-4 text-left text-xs font-medium text-slate-400">Verified Grade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="group border-b border-slate-100 last:border-0">
              <td className="px-4 py-2.5 font-medium text-slate-950">{row.farmer}</td>
              <td className="px-3 py-2.5 text-slate-600">{row.produce}</td>
              <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{row.declaredQty} kg, Grade {row.requestedGrade}</td>
              <td className="p-0">
                <div className="flex h-11 items-center px-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.verifiedQty}
                    onChange={(e) => setCell(i, "verifiedQty", e.target.value)}
                    placeholder="Enter value"
                    className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-300 focus:bg-slate-50 rounded px-1"
                  />
                </div>
              </td>
              <td className="p-0">
                <div className="flex h-11 items-center px-4">
                  <input
                    type="text"
                    value={row.verifiedGrade}
                    onChange={(e) => setCell(i, "verifiedGrade", e.target.value)}
                    placeholder="Grade"
                    className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-300 focus:bg-slate-50 rounded px-1"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <div className="space-y-4">
        {/* Row 1: Buyer Payment · Order Value · Farmer Payout · Invoice */}
        <div className="grid grid-cols-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Buyer Payment</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${buyerPaymentStatus === "Received" ? "bg-green-500" : "bg-amber-400"}`} />
              <p className="text-sm text-slate-900">{buyerPaymentStatus}</p>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Order Value</p>
            <p className="mt-1 text-sm text-slate-900">{formatCurrency(invoiceAmount)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Farmer Payout</p>
            <p className="mt-1 text-sm text-slate-900">{farmerRows.length} farmers</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Invoice</p>
            <button type="button" onClick={onOpenInvoice} className="mt-1 flex items-center gap-1 text-sm text-leaf hover:underline">
              <FileText size={12} /> INV-{order.id}
            </button>
          </div>
        </div>

        {/* Row 2: Net Payout · Coop Fee · Logistics · Payment Details */}
        <div className="grid grid-cols-4 border-t border-slate-100 pt-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Net Payout</p>
            <p className="mt-1 text-sm text-slate-900">{formatCurrency(totalNet)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Coop Fee</p>
            <p className="mt-1 text-sm text-slate-900">{formatCurrency(totalCoopFee)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Logistics</p>
            <p className="mt-1 text-sm text-slate-900">{formatCurrency(totalLogistics)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Payment Details</p>
            <button type="button" onClick={() => setDetailsOpen(true)} className="mt-1 flex items-center gap-1 text-sm text-leaf hover:underline">
              <FileText size={12} /> View breakdown
            </button>
          </div>
        </div>

        {settled && (
          <p className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 size={14} /> Payment released to all farmers.
          </p>
        )}
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
