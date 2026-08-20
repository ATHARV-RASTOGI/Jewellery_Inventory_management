import React from "react";
import { printSlipContainer } from "@/lib/styles";
import { fmtDate } from "@/lib/utils";

export interface CustomerInfo {
  name: string;
  fatherName?: string;
  phone?: string;
  address?: string;
  date: string;
  dateLabel?: string;
  statusBadge?: React.ReactNode;
  additionalInfo?: React.ReactNode;
}

interface PrintSlipProps {
  title: string;
  idLabel: string;
  id: string | number;
  customer: CustomerInfo;
  footerNotes?: React.ReactNode;
  children: React.ReactNode;
}

export const PrintSlip: React.FC<PrintSlipProps> = ({
  title,
  idLabel,
  id,
  customer,
  footerNotes,
  children,
}) => {
  return (
    <div className={printSlipContainer}>
      {/* ── Official Shop Header ── */}
      <div className="text-center pb-4 border-b-2 border-black">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">
          K.K. JEWELLERS
        </h1>
        <p className="text-xs sm:text-[13px] font-semibold text-gray-800 tracking-wide mt-0.5">
          Gold, Silver &amp; Diamond Merchants · Bankers
        </p>
        <p className="text-xs text-gray-700 mt-1">
          Nehru Road, Farrukhabad, U.P. — 209625
        </p>
        <p className="text-xs text-gray-600 font-medium">
          Phone: +91 94151 88470 / 98380 12345
        </p>
      </div>

      {/* ── Voucher Title & Number ── */}
      <div className="flex items-center justify-between py-3 border-b border-gray-300 text-xs sm:text-sm">
        <div>
          <span className="font-bold text-gray-800 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <div className="text-right">
          <span className="font-bold">{idLabel}: </span>
          <span className="font-mono font-bold text-base">#{id}</span>
        </div>
      </div>

      {/* ── Customer Information Details ── */}
      <div className="grid grid-cols-2 gap-4 py-3.5 border-b border-gray-300 text-xs leading-relaxed">
        <div className="space-y-0.5">
          <p>
            <span className="font-bold text-gray-700">Customer: </span>
            <span className="font-bold text-sm text-black">{customer.name}</span>
          </p>
          {customer.fatherName && (
            <p>
              <span className="font-bold text-gray-700">Father's/Spouse: </span>
              <span>{customer.fatherName}</span>
            </p>
          )}
          <p>
            <span className="font-bold text-gray-700">Mobile: </span>
            <span className="font-mono">{customer.phone || "—"}</span>
          </p>
          {customer.address && (
            <p>
              <span className="font-bold text-gray-700">Address: </span>
              <span>{customer.address}</span>
            </p>
          )}
        </div>

        <div className="space-y-0.5 sm:text-right">
          <p>
            <span className="font-bold text-gray-700">
              {customer.dateLabel || "Date"}:{" "}
            </span>
            <span className="font-medium">{fmtDate(customer.date)}</span>
          </p>
          {customer.statusBadge && (
            <div className="pt-0.5">{customer.statusBadge}</div>
          )}
          {customer.additionalInfo}
        </div>
      </div>

      {/* ── Main Slip Content ── */}
      {children}

      {/* ── Footer Notes & Dual Signatures ── */}
      {footerNotes ? (
        <div className="pt-2 text-[10.5px] text-gray-600 text-center space-y-0.5">
          {footerNotes}
        </div>
      ) : (
        <div className="pt-2 text-[10.5px] text-gray-600 text-center space-y-0.5">
          <p>Please present this voucher copy at the time of delivery/settlement.</p>
          <p>Certified pure gold, silver &amp; diamond craftsmanship guaranteed.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 pt-6 mt-3 border-t border-black text-xs">
        <div className="text-center space-y-1">
          <div className="border-b border-black w-32 mx-auto mb-1 h-5" />
          <p className="font-bold">Customer Signature</p>
        </div>
        <div className="text-center space-y-1">
          <div className="border-b border-black w-32 mx-auto mb-1 h-5" />
          <p className="font-bold">For K.K. JEWELLERS</p>
        </div>
      </div>
    </div>
  );
};
