package com.ems.Exportdata.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import com.ems.inventory.model.Product;
import com.ems.inventory.repository.ProductRepository;
import com.ems.loan.model.InterestPayment;
import com.ems.loan.model.Loan;
import com.ems.loan.repository.InterestPaymentRepository;
import com.ems.loan.repository.LoanRepository;
import com.ems.sales.model.Saleitem;
import com.ems.sales.model.Sales;
import com.ems.sales.repository.SaleItemRepository;
import com.ems.sales.repository.SalesRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final LoanRepository           loanRepo;
    private final InterestPaymentRepository interestPaymentRepo;
    private final SalesRepository           salesRepo;
    private final SaleItemRepository        saleItemRepo;
    private final ProductRepository         proRepo;

    // ─── Main entry point ─────────────────────────────────────────────────────

    public byte[] exportToExcel(boolean includeLoan,
                                boolean includeInventory,
                                boolean includeSales,
                                boolean includeSummary) throws IOException {

        try (Workbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle   = buildHeaderStyle(wb);
            CellStyle currencyStyle = buildCurrencyStyle(wb);
            CellStyle dateStyle     = buildDateStyle(wb);

            if (includeLoan)      writeLoanSheet(wb, headerStyle, currencyStyle, dateStyle);
            if (includeInventory) writeInventorySheet(wb, headerStyle, currencyStyle);
            if (includeSales)     writeSalesSheet(wb, headerStyle, currencyStyle, dateStyle);
            if (includeSummary)   writeSummarySheet(wb, headerStyle, currencyStyle,
                                                    includeLoan, includeInventory, includeSales);

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ─── Loan sheet ───────────────────────────────────────────────────────────
    // Sheet 1: Loans  — one row per Loan record
    // Sheet 2: Interest Payments — one row per InterestPayment record

    private void writeLoanSheet(Workbook wb, CellStyle headerStyle,
                                CellStyle currencyStyle, CellStyle dateStyle) {

        // ── Loans ──
        Sheet loanSheet = wb.createSheet("Loans");
        String[] loanCols = {
            "Loan ID", "Customer Name", "Mobile No", "Address",
            "Jewelry Description", "Metal", "Weight (g)",
            "Loan Amount (₹)", "Issue Date", "Close Date",
            "Settlement Amount (₹)", "Status", "Description"
        };
        writeHeader(loanSheet, loanCols, headerStyle);

        List<Loan> loans = loanRepo.findAll();
        int rowIdx = 1;
        for (Loan l : loans) {
            Row row = loanSheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(l.getId() != null ? l.getId() : 0L);
            row.createCell(1).setCellValue(nullSafe(l.getName()));
            row.createCell(2).setCellValue(nullSafe(l.getMobileNo()));
            row.createCell(3).setCellValue(nullSafe(l.getAddress()));
            row.createCell(4).setCellValue(nullSafe(l.getJewelryDescription()));
            row.createCell(5).setCellValue(nullSafe(l.getMetal()));
            row.createCell(6).setCellValue(l.getWeight() != null ? l.getWeight() : 0.0);
            setCurrency(row, 7, l.getLoanAmount(), currencyStyle);
            row.createCell(8).setCellValue(
                l.getIssueDate() != null ? l.getIssueDate().toString() : "");
            row.createCell(9).setCellValue(nullSafe(l.getCloseDate()));
            setCurrency(row, 10, l.getSettlementAmount(), currencyStyle);
            row.createCell(11).setCellValue(nullSafe(l.getStatus()));
            row.createCell(12).setCellValue(nullSafe(l.getDescription()));
        }
        autoSize(loanSheet, loanCols.length);

        // ── Interest Payments ──
        Sheet paySheet = wb.createSheet("Interest Payments");
        String[] payCols = {
            "Payment ID", "Loan ID", "Amount Paid (₹)",
            "Payment Date", "Balance After (₹)"
        };
        writeHeader(paySheet, payCols, headerStyle);

        List<InterestPayment> payments = interestPaymentRepo.findAll();
        int payIdx = 1;
        for (InterestPayment p : payments) {
            Row row = paySheet.createRow(payIdx++);
            row.createCell(0).setCellValue(p.getId() != null ? p.getId() : 0L);
            row.createCell(1).setCellValue(p.getLoanId() != null ? p.getLoanId() : 0L);
            setCurrency(row, 2, p.getAmountPaid(),  currencyStyle);
            row.createCell(3).setCellValue(
                p.getPaymentDate() != null ? p.getPaymentDate().toString() : "");
            setCurrency(row, 4, p.getBalanceAfter(), currencyStyle);
        }
        autoSize(paySheet, payCols.length);
    }

    // ─── Inventory sheet ──────────────────────────────────────────────────────
    // Sheet: Products — one row per Product record

    private void writeInventorySheet(Workbook wb, CellStyle headerStyle,
                                     CellStyle currencyStyle) {

        Sheet sheet = wb.createSheet("Inventory");
        String[] cols = {
            "Product ID", "Name", "SKU",
            "Main Category", "Sub Category", "Material",
            "Purity", "Base Weight (g)", "Stock Qty", "Price (₹)"
        };
        writeHeader(sheet, cols, headerStyle);

        List<Product> products = proRepo.findAll();
        int rowIdx = 1;
        for (Product p : products) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(p.getId() != null ? p.getId() : 0L);
            row.createCell(1).setCellValue(nullSafe(p.getName()));
            row.createCell(2).setCellValue(nullSafe(p.getSku()));
            row.createCell(3).setCellValue(nullSafe(p.getMainCategory()));
            row.createCell(4).setCellValue(nullSafe(p.getSubCategory()));
            row.createCell(5).setCellValue(nullSafe(p.getMaterial()));
            row.createCell(6).setCellValue(nullSafe(p.getPurity()));
            row.createCell(7).setCellValue(p.getBaseWeight() != null ? p.getBaseWeight() : 0.0);
            row.createCell(8).setCellValue(p.getStockQuantity() != null ? p.getStockQuantity() : 0);
            setCurrency(row, 9, p.getPrice(), currencyStyle);
        }
        autoSize(sheet, cols.length);
    }

    // ─── Sales sheet ──────────────────────────────────────────────────────────
    // Sheet 1: Sales  — one row per Sales invoice
    // Sheet 2: Sale Items — one row per Saleitem line

    private void writeSalesSheet(Workbook wb, CellStyle headerStyle,
                                 CellStyle currencyStyle, CellStyle dateStyle) {

        // ── Sales invoices ──
        Sheet salesSheet = wb.createSheet("Sales");
        String[] salesCols = {
            "Sale ID", "Sale Date", "Customer Name",
            "Customer Phone", "Customer Address",
            "Subtotal (₹)", "GST Amount (₹)", "Grand Total (₹)"
        };
        writeHeader(salesSheet, salesCols, headerStyle);

        List<Sales> allSales = salesRepo.findAllByOrderBySaleDateDesc();
        int rowIdx = 1;
        for (Sales s : allSales) {
            Row row = salesSheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(s.getId() != null ? s.getId() : 0L);
            row.createCell(1).setCellValue(
                s.getSaleDate() != null ? s.getSaleDate().toString() : "");
            row.createCell(2).setCellValue(nullSafe(s.getCustomerName()));
            row.createCell(3).setCellValue(nullSafe(s.getCustomerPhoneNo()));
            row.createCell(4).setCellValue(nullSafe(s.getCustomerAddress()));
            setCurrency(row, 5, s.getSubtotal(),   currencyStyle);
            setCurrency(row, 6, s.getGstAmount(),  currencyStyle);
            setCurrency(row, 7, s.getGrandTotal(), currencyStyle);
        }
        autoSize(salesSheet, salesCols.length);

        // ── Sale line items ──
        Sheet itemSheet = wb.createSheet("Sale Items");
        String[] itemCols = {
            "Item ID", "Sale ID", "SKU", "Product Name",
            "Material", "Purity", "Weight (g)",
            "Quantity", "Price Per Piece (₹)", "Line Total (₹)"
        };
        writeHeader(itemSheet, itemCols, headerStyle);

        List<Saleitem> allItems = saleItemRepo.findAll();
        int itemRowIdx = 1;
        for (Saleitem item : allItems) {
            Row row = itemSheet.createRow(itemRowIdx++);
            row.createCell(0).setCellValue(item.getId()     != null ? item.getId()     : 0L);
            row.createCell(1).setCellValue(item.getSaleId() != null ? item.getSaleId() : 0L);
            row.createCell(2).setCellValue(nullSafe(item.getSku()));
            row.createCell(3).setCellValue(nullSafe(item.getProductName()));
            row.createCell(4).setCellValue(nullSafe(item.getMaterial()));
            row.createCell(5).setCellValue(nullSafe(item.getPurity()));
            row.createCell(6).setCellValue(item.getWeight()   != null ? item.getWeight()   : 0.0);
            row.createCell(7).setCellValue(item.getQuantity() != null ? item.getQuantity() : 0);
            setCurrency(row, 8, item.getPricePerPiece(), currencyStyle);
            setCurrency(row, 9, item.getLineTotal(),     currencyStyle);
        }
        autoSize(itemSheet, itemCols.length);
    }

    // ─── Summary sheet ────────────────────────────────────────────────────────

    private void writeSummarySheet(Workbook wb, CellStyle headerStyle,
                                   CellStyle currencyStyle,
                                   boolean includeLoan,
                                   boolean includeInventory,
                                   boolean includeSales) {

        Sheet sheet = wb.createSheet("Summary");
        writeHeader(sheet, new String[]{"Category", "Metric", "Value"}, headerStyle);

        int ri = 1;

        // ── Loan summary ──
        if (includeLoan) {
            List<Loan> loans = loanRepo.findAll();
            List<InterestPayment> payments = interestPaymentRepo.findAll();

            double totalLoanAmount = loans.stream()
                .mapToDouble(l -> l.getLoanAmount() != null ? l.getLoanAmount() : 0.0).sum();
            double totalSettlement = loans.stream()
                .filter(l -> l.getSettlementAmount() != null)
                .mapToDouble(Loan::getSettlementAmount).sum();
            double totalInterestPaid = payments.stream()
                .mapToDouble(p -> p.getAmountPaid() != null ? p.getAmountPaid() : 0.0).sum();
            long activeLoans = loans.stream()
                .filter(l -> "Active".equalsIgnoreCase(l.getStatus())).count();
            long closedLoans = loans.stream()
                .filter(l -> "Closed".equalsIgnoreCase(l.getStatus())).count();

            ri = addSummaryRow(sheet, ri, "Loans", "Total Loans",              loans.size());
            ri = addSummaryRow(sheet, ri, "Loans", "Active Loans",             activeLoans);
            ri = addSummaryRow(sheet, ri, "Loans", "Closed Loans",             closedLoans);
            ri = addSummaryRow(sheet, ri, "Loans", "Total Loan Amount (₹)",    totalLoanAmount);
            ri = addSummaryRow(sheet, ri, "Loans", "Total Interest Paid (₹)",  totalInterestPaid);
            ri = addSummaryRow(sheet, ri, "Loans", "Total Settlement (₹)",     totalSettlement);
            ri = addSummaryRow(sheet, ri, "Loans", "Total Payments Made",      payments.size());
        }

        // ── Inventory summary ──
        if (includeInventory) {
            List<Product> products = proRepo.findAll();

            double totalStockValue = products.stream()
                .mapToDouble(p -> {
                    double price = p.getPrice()         != null ? p.getPrice()         : 0.0;
                    int    qty   = p.getStockQuantity() != null ? p.getStockQuantity() : 0;
                    return price * qty;
                }).sum();
            int totalStockQty = products.stream()
                .mapToInt(p -> p.getStockQuantity() != null ? p.getStockQuantity() : 0).sum();

            ri = addSummaryRow(sheet, ri, "Inventory", "Total Products",          products.size());
            ri = addSummaryRow(sheet, ri, "Inventory", "Total Stock Qty",         totalStockQty);
            ri = addSummaryRow(sheet, ri, "Inventory", "Total Stock Value (₹)",   totalStockValue);
        }

        // ── Sales summary ──
        if (includeSales) {
            List<Sales> sales = salesRepo.findAll();
            List<Saleitem> items = saleItemRepo.findAll();

            double totalRevenue = sales.stream()
                .mapToDouble(s -> s.getGrandTotal() != null ? s.getGrandTotal() : 0.0).sum();
            double totalGst = sales.stream()
                .mapToDouble(s -> s.getGstAmount()  != null ? s.getGstAmount()  : 0.0).sum();
            double totalSubtotal = sales.stream()
                .mapToDouble(s -> s.getSubtotal()   != null ? s.getSubtotal()   : 0.0).sum();
            int totalItemsSold = items.stream()
                .mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();

            ri = addSummaryRow(sheet, ri, "Sales", "Total Transactions",       sales.size());
            ri = addSummaryRow(sheet, ri, "Sales", "Total Revenue (₹)",        totalRevenue);
            ri = addSummaryRow(sheet, ri, "Sales", "Total GST (₹)",            totalGst);
            ri = addSummaryRow(sheet, ri, "Sales", "Subtotal excl GST (₹)",    totalSubtotal);
            ri = addSummaryRow(sheet, ri, "Sales", "Total Items Sold",         totalItemsSold);
        }

        autoSize(sheet, 3);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void writeHeader(Sheet sheet, String[] cols, CellStyle style) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < cols.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(cols[i]);
            cell.setCellStyle(style);
        }
    }

    /** Returns next available row index */
    private int addSummaryRow(Sheet sheet, int rowIndex,
                              String category, String metric, double value) {
        Row row = sheet.createRow(rowIndex);
        row.createCell(0).setCellValue(category);
        row.createCell(1).setCellValue(metric);
        row.createCell(2).setCellValue(value);
        return rowIndex + 1;
    }

    private void setCurrency(Row row, int col, Double value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : 0.0);
        cell.setCellStyle(style);
    }

    private void autoSize(Sheet sheet, int colCount) {
        for (int i = 0; i < colCount; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private String nullSafe(String value) {
        return value != null ? value : "";
    }

    // ─── Style builders ───────────────────────────────────────────────────────

    private CellStyle buildHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle buildCurrencyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat fmt  = wb.createDataFormat();
        style.setDataFormat(fmt.getFormat("#,##0.00"));
        return style;
    }

    private CellStyle buildDateStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat fmt  = wb.createDataFormat();
        style.setDataFormat(fmt.getFormat("yyyy-mm-dd"));
        return style;
    }
}