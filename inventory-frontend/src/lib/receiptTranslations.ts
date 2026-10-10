export type SlipLanguage = "en" | "hi" | "bilingual";

export interface SlipTextRecord {
  titleLoanPledge: string;
  titleStatement: string;
  accountNo: string;
  customerName: string;
  fatherSpouse: string;
  mobile: string;
  address: string;
  date: string;
  originationDate: string;
  status: string;
  activeStatus: string;
  closedStatus: string;
  collateralHeader: string;
  metal: string;
  netWeight: string;
  itemDescription: string;
  principalAmount: string;
  amountInWords: string;
  termsTitle: string;
  term1: string;
  term2: string;
  term3: string;
  borrowerSign: string;
  shopSign: string;
  paymentHistoryHeader: string;
  paidDate: string;
  principalDisbursed: string;
  interestPaid: string;
  balanceRemaining: string;
  totalPaid: string;
  outstandingBalance: string;
}

export const SLIP_TEXT: Record<SlipLanguage, SlipTextRecord> = {
  en: {
    titleLoanPledge: "Collateral Loan Pledge Voucher",
    titleStatement: "Loan Statement & Payment Record",
    accountNo: "Loan Account No",
    customerName: "Customer Name",
    fatherSpouse: "Father's / Spouse Name",
    mobile: "Mobile No.",
    address: "Residential Address",
    date: "Date",
    originationDate: "Origination Date",
    status: "Status",
    activeStatus: "Active",
    closedStatus: "Closed / Settled",
    collateralHeader: "Collateral Pledged (Girvi Ornaments)",
    metal: "Metal",
    netWeight: "Net Weight",
    itemDescription: "Item Description & Hallmarks",
    principalAmount: "Principal Loan Amount Disbursed",
    amountInWords: "Amount in Words",
    termsTitle: "Terms & Conditions",
    term1: "1. The borrower has pledged the jewelry ornaments mentioned above in sound physical condition as collateral against the received principal loan amount.",
    term2: "2. Interest is calculated monthly as agreed. Collateral shall be safely redeemed upon full clearance of principal and accrued interest.",
    term3: "3. If the loan is not cleared or renewed within the stipulated tenure, the shop reserves the right to issue legal notices as per pawn-broking regulations.",
    borrowerSign: "Borrower's Signature / Thumb Impression",
    shopSign: "For K.K. Jewellers (Authorized Signatory)",
    paymentHistoryHeader: "Payment History & Settlements Till Date",
    paidDate: "Date",
    principalDisbursed: "Disbursement",
    interestPaid: "Interest Paid",
    balanceRemaining: "Balance",
    totalPaid: "Total Interest Paid Till Date",
    outstandingBalance: "Current Outstanding Balance",
  },
  hi: {
    titleLoanPledge: "बंधक रसीद (गिरवी पत्र)",
    titleStatement: "ऋण खाता विवरण एवं भुगतान रसीद",
    accountNo: "ऋण खाता संख्या",
    customerName: "ग्राहक का नाम",
    fatherSpouse: "पिता / पति का नाम",
    mobile: "मोबाइल नंबर",
    address: "निवास का पता",
    date: "दिनांक",
    originationDate: "ऋण प्रारंभ दिनांक",
    status: "स्थिति",
    activeStatus: "सक्रिय (चालू)",
    closedStatus: "समाप्त (पूर्ण चुकता)",
    collateralHeader: "गिरवी रखा सामान (आभूषण विवरण)",
    metal: "धातु",
    netWeight: "शुद्ध वजन",
    itemDescription: "आभूषण का विवरण व निशान",
    principalAmount: "स्वीकृत मूलधन राशि",
    amountInWords: "राशि शब्दों में",
    termsTitle: "नियम व शर्तें",
    term1: "१. ऋणी ने ऊपर उल्लिखित आभूषण पूर्णतः सही स्थिति में बंधक (गिरवी) रखकर ऋण राशि प्राप्त की है।",
    term2: "२. ब्याज दर मासिक तय की गई है। मूलधन व समस्त ब्याज का पूर्ण भुगतान करने पर गिरवी आभूषण सकुशल वापस सौंपे जाएंगे।",
    term3: "३. निर्धारित समयावधि में ऋण चुकता या नवीनीकरण न होने पर नियमानुसार नोटिस जारी कर आभूषण निस्तारण का अधिकार सुरक्षित है।",
    borrowerSign: "ऋणी के हस्ताक्षर / अंगूठे का निशान",
    shopSign: "कृते के.के. ज्वैलर्स (अधिकृत हस्ताक्षर)",
    paymentHistoryHeader: "अब तक का भुगतान एवं खाता विवरण",
    paidDate: "दिनांक",
    principalDisbursed: "वितरण राशि",
    interestPaid: "प्राप्त ब्याज",
    balanceRemaining: "शेष मूलधन",
    totalPaid: "अब तक कुल प्राप्त ब्याज",
    outstandingBalance: "वर्तमान कुल देय राशि",
  },
  bilingual: {
    titleLoanPledge: "Collateral Loan Pledge Voucher / बंधक रसीद (गिरवी पत्र)",
    titleStatement: "Loan Statement & Record / ऋण खाता विवरण",
    accountNo: "Loan Account No. / खाता संख्या",
    customerName: "Customer / ग्राहक का नाम",
    fatherSpouse: "Father's/Spouse / पिता/पति का नाम",
    mobile: "Mobile / मोबाइल",
    address: "Address / निवास पता",
    date: "Date / दिनांक",
    originationDate: "Origination Date / ऋण दिनांक",
    status: "Status / स्थिति",
    activeStatus: "Active / सक्रिय",
    closedStatus: "Closed / चुकता",
    collateralHeader: "Collateral Pledged / गिरवी रखा सामान (आभूषण)",
    metal: "Metal / धातु",
    netWeight: "Net Wt / शुद्ध वजन",
    itemDescription: "Description & Marks / आभूषण विवरण",
    principalAmount: "Principal Loan Disbursed / स्वीकृत मूलधन राशि",
    amountInWords: "Amount in Words / राशि शब्दों में",
    termsTitle: "Terms & Conditions / नियम व शर्तें",
    term1: "1. The borrower has pledged ornaments in sound condition. / ऋणी ने आभूषण सही स्थिति में बंधक रखकर ऋण राशि प्राप्त की है।",
    term2: "2. Interest is monthly. Redeemed on full clearance. / ब्याज मासिक तय है। पूर्ण चुकता होने पर आभूषण वापस मिलेंगे।",
    term3: "3. If overdue without renewal, legal notice will be issued. / निर्धारित अवधि में चुकता न करने पर नियमानुसार नोटिस जारी होगा।",
    borrowerSign: "Borrower's Signature / ऋणी के हस्ताक्षर",
    shopSign: "For K.K. Jewellers / अधिकृत हस्ताक्षर",
    paymentHistoryHeader: "Payment History Till Date / भुगतान इतिहास विवरण",
    paidDate: "Date / दिनांक",
    principalDisbursed: "Disbursement / वितरण",
    interestPaid: "Interest Paid / प्राप्त ब्याज",
    balanceRemaining: "Balance / शेष",
    totalPaid: "Total Interest Paid / कुल प्राप्त ब्याज",
    outstandingBalance: "Current Balance / वर्तमान कुल देय",
  },
};
