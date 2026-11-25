import React from 'react';
import { Check, Package, Truck, Home, Box, XCircle } from 'lucide-react';
import { getOrderTimelineIndex, ORDER_STATUS_SEQUENCE } from '../utils/commerce';
import type { TrackingEvent } from '../types';

const STEP_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  PLACED: { label: 'Order Placed', icon: Package },
  PACKED: { label: 'Packed', icon: Box },
  SHIPPED: { label: 'Shipped', icon: Truck },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', icon: Truck },
  DELIVERED: { label: 'Delivered', icon: Home },
};

export function OrderTimeline({
  status,
  history,
}: {
  status: string;
  history: TrackingEvent[];
}) {
  if (status === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800">
        <XCircle className="w-5 h-5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">Order Cancelled</p>
          <p className="text-xs text-red-700 mt-0.5">
            {history[history.length - 1]?.note || 'This order was cancelled.'}
          </p>
        </div>
      </div>
    );
  }

  const currentIdx = getOrderTimelineIndex(status);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {ORDER_STATUS_SEQUENCE.map((step, idx) => {
          const meta = STEP_META[step];
          const Icon = meta.icon;
          const completed = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={step} className="flex flex-col items-center text-center relative">
              {idx > 0 && (
                <div
                  className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${
                    idx <= currentIdx ? 'bg-emerald-700' : 'bg-[#E2E8E4]'
                  }`}
                />
              )}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                  completed
                    ? 'bg-emerald-700 border-emerald-700 text-white'
                    : 'bg-white border-[#D1DBD5] text-[#6B7280]'
                } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
              >
                {completed && idx < currentIdx ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span
                className={`mt-2 text-[11px] sm:text-xs font-medium leading-tight ${
                  completed ? 'text-[#0B1914]' : 'text-[#6B7280]'
                }`}
              >
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <div className="border-t border-[#E5EAE7] pt-3 space-y-2">
          {history
            .slice()
            .reverse()
            .map((ev, idx) => (
              <div key={`${ev.status}-${idx}`} className="flex items-start justify-between gap-4 text-xs">
                <span className="text-[#111827] font-medium">
                  {STEP_META[ev.status]?.label || ev.status} —{' '}
                  <span className="font-normal text-[#4B5563]">{ev.note}</span>
                </span>
                <span className="text-[#6B7280] tabular-nums shrink-0">
                  {new Date(ev.timestamp).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
