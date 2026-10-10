import React from "react";
import { printSlipContainer } from "@/lib/styles";
import { fmtDate } from "@/lib/utils";
import { SLIP_TEXT, type SlipLanguage } from "@/lib/receiptTranslations";

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
  language?: SlipLanguage;
  onLanguageChange?: (lang: SlipLanguage) => void;
}

export const PrintSlip: React.FC<PrintSlipProps> = ({
  title,
  idLabel,
  id,
  customer,
  footerNotes,
  children,
  language = "bilingual",
  onLanguageChange,
}) => {
  const t = SLIP_TEXT[language] || SLIP_TEXT.bilingual;

  return (
    <div className={printSlipContainer}>
      {/* ── Interactive Language Switcher (Hidden during physical print) ── */}
      {onLanguageChange && (
        <div className="print:hidden mb-4 p-2 bg-gray-50 border border-gray-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
            <span className="font-semibold">Print Language / पर्ची की भाषा:</span>
          </div>
          <div className="inline-flex rounded-md shadow-sm border border-gray-300 bg-white p-0.5" role="group">
            <button
              type="button"
              onClick={() => onLanguageChange("bilingual")}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                language === "bilingual"
                  ? "bg-black text-white"
                  : "text-gray-700 hover:text-black hover:bg-gray-100"
              }`}
            >
              द्विभाषी (Bilingual)
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("hi")}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                language === "hi"
                  ? "bg-black text-white"
                  : "text-gray-700 hover:text-black hover:bg-gray-100"
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("en")}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                language === "en"
                  ? "bg-black text-white"
                  : "text-gray-700 hover:text-black hover:bg-gray-100"
              }`}
            >
              English
            </button>
          </div>
        </div>
      )}

      {/* ── Official Shop Header ── */}
      <div className="text-center pb-4 border-b-2 border-black">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">
          {language === "hi"
            ? "के.के. ज्वैलर्स"
            : language === "bilingual"
            ? "K.K. JEWELLERS / के.के. ज्वैलर्स"
            : "K.K. JEWELLERS"}
        </h1>
        <p className="text-xs sm:text-[13px] font-semibold text-gray-800 tracking-wide mt-0.5">
          {language === "hi"
            ? "सोना, चाँदी एवं हीरा व्यापारी · महाजन (बैंकर)"
            : language === "bilingual"
            ? "Gold, Silver & Diamond Merchants · Bankers / सराफा व्यापारी"
            : "Gold, Silver & Diamond Merchants · Bankers"}
        </p>
        <p className="text-xs text-gray-700 mt-1">
          {language === "hi"
            ? "१२३, सर्राफा बाजार, शहर, उ.प्र. — २००००१"
            : "123, Sarafa Bazar, City, U.P. — 200001"}
        </p>
        <p className="text-xs text-gray-600 font-medium">
          {language === "hi" ? "दूरभाष" : "Phone"}: +91 98765 43210 / 91234 56789
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
            <span className="font-bold text-gray-700">{t.customerName}: </span>
            <span className="font-bold text-sm text-black">{customer.name}</span>
          </p>
          {customer.fatherName && (
            <p>
              <span className="font-bold text-gray-700">{t.fatherSpouse}: </span>
              <span>{customer.fatherName}</span>
            </p>
          )}
          <p>
            <span className="font-bold text-gray-700">{t.mobile}: </span>
            <span className="font-mono">{customer.phone || "—"}</span>
          </p>
          {customer.address && (
            <p>
              <span className="font-bold text-gray-700">{t.address}: </span>
              <span>{customer.address}</span>
            </p>
          )}
        </div>

        <div className="space-y-0.5 sm:text-right">
          <p>
            <span className="font-bold text-gray-700">
              {customer.dateLabel || t.date}:{" "}
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
          {language === "hi" ? (
            <>
              <p>कृपया सामान छुड़ाने अथवा हिसाब के समय इस रसीद को साथ लाएं।</p>
              <p>शुद्ध सोने, चाँदी व हीरे के आभूषणों की विश्वसनीयता की पूर्ण गारंटी।</p>
            </>
          ) : language === "bilingual" ? (
            <>
              <p>Please present this voucher copy at the time of delivery/settlement. / हिसाब व डिलीवरी पर यह रसीद प्रस्तुत करें।</p>
              <p>Certified pure gold, silver &amp; diamond craftsmanship guaranteed. / शुद्धता व प्रमाणिकता की पूर्ण गारंटी।</p>
            </>
          ) : (
            <>
              <p>Please present this voucher copy at the time of delivery/settlement.</p>
              <p>Certified pure gold, silver &amp; diamond craftsmanship guaranteed.</p>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 pt-6 mt-3 border-t border-black text-xs">
        <div className="text-center space-y-1">
          <div className="border-b border-black w-36 mx-auto mb-1 h-5" />
          <p className="font-bold">{t.borrowerSign}</p>
        </div>
        <div className="text-center space-y-1">
          <div className="border-b border-black w-36 mx-auto mb-1 h-5" />
          <p className="font-bold">{t.shopSign}</p>
        </div>
      </div>
    </div>
  );
};
