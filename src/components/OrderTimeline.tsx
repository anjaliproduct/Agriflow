import { Check } from "lucide-react";
import { OrderStatus } from "../types";

const steps: OrderStatus[] = ["New", "Allocated", "Pickup Scheduled", "Collected", "Quality Verified", "Dispatched", "Delivered", "Settled"];

export default function OrderTimeline({ status }: { status: OrderStatus }) {
  const index = steps.indexOf(status);
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((step, stepIndex) => {
        const done = stepIndex <= index;
        return (
          <div key={step} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${done ? "border-green-200 bg-field text-green-800" : "border-slate-200 bg-white text-slate-500"}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-leaf text-white" : "bg-slate-100"}`}>
              {done ? <Check size={13} /> : stepIndex + 1}
            </span>
            {step}
          </div>
        );
      })}
    </div>
  );
}
