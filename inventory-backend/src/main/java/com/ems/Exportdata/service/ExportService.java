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
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;

import com.ems.inventory.model.Product;
import com.ems.inventory.repository.ProductRepository;
import com.ems.loan.model.InterestPayment;
import com.ems.loan.model.Loan;
import com.ems.loan.model.LoanStatus;
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

    private final LoanRepository loanRepo;
    private final InterestPaymentRepository interestPaymentRepo;
    private final SalesRepository salesRepo;
    private final SaleItemRepository saleItemRepo;
    private final ProductRepository proRepo;

    // ─── Main entry point ─────────────────────────────────────────────────────

    public byte[] exportToExcel(boolean includeLoan,
            boolean includeInventory,
            boolean includeSales,
            boolean includeSummary,
            boolean includeGold,
            boolean includeSilver) throws IOException {

        // Streaming workbook with row window of 100 to prevent heap memory exhaustion
        try (SXSSFWorkbook wb = new SXSSFWorkbook(100);
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            wb.setCompressTempFiles(true);

            CellStyle headerStyle = buildHeaderStyle(wb);
            CellStyle currencyStyle = buildCurrencyStyle(wb);
            CellStyle dateStyle = buildDateStyle(wb);

            // Single-pass data query reuse across specific sheets and summary sheet
            List<Loan> loans = (includeLoan || includeSummary) ? loanRepo.findAll() : null;
            List<InterestPayment> payments = (includeLoan || includeSummary) ? interestPaymentRepo.findAll() : null;
            List<Product> products = (includeInventory || includeSummary) ? proRepo.findAll() : null;
            List<Sales> allSales = (includeSales || includeSummary) ? salesRepo.findAllByOrderBySaleDateDesc() : null;
            List<Saleitem> allItems = (includeSales || includeSummary) ? saleItemRepo.findAll() : null;

            if (includeLoan && loans != null && payments != null) {
                writeLoanSheet(wb, loans, payments, headerStyle, currencyStyle, dateStyle);
            }
            if (includeInventory && products != null) {
                writeInventorySheet(wb, products, headerStyle, currencyStyle);
            }
            if (includeSales && allSales != null && allItems != null) {
                writeSalesSheet(wb, allSales, allItems, headerStyle, currencyStyle, dateStyle);
            }
            if (includeSummary) {
                writeSummarySheet(wb, loans, payments, products, allSales, allItems,
                        headerStyle, currencyStyle, includeLoan, includeInventory, includeSales);
            }
            if (includeGold) {
                List<Product> goldProducts = proRepo.findByMaterialGold();
                writeGoldData(wb, goldProducts, headerStyle, currencyStyle);
            }
            if (includeSilver) {
                List<Product> silverProducts = proRepo.findByMaterialSilver();
                writeSilverData(wb, silverProducts, headerStyle, currencyStyle);
            }

            wb.write(out);
            wb.dispose(); // Clean up streaming temporary files on disk
            return out.toByteArray();
        }
    }

    // ─── Loan sheet ───────────────────────────────────────────────────────────

    private void writeLoanSheet(Workbook wb, List<Loan> loans, List<InterestPayment> payments,
            CellStyle headerStyle, CellStyle currencyStyle, CellStyle dateStyle) {

        // ── Loans ──
        Sheet loanSheet = createTrackedSheet(wb, "Loans");
        String[] loanCols = {
                "Loan ID", "Customer Name", "Father's Name", "Mobile No", "Address",
                "Jewelry Description", "Metal", "Weight (g)",
                "Loan Amount (₹)", "Issue Date", "Close Date",
                "Settlement Amount (₹)", "Status", "Description"
        };
        writeHeader(loanSheet, loanCols, headerStyle);

        int rowIdx = 1;
        for (Loan l : loans) {
            Row row = loanSheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(l.getId() != null ? l.getId() : 0L);
            row.createCell(1).setCellValue(nullSafe(l.getName()));
            row.createCell(2).setCellValue(nullSafe(l.getFatherName()));
            row.createCell(3).setCellValue(nullSafe(l.getMobileNo()));
            row.createCell(4).setCellValue(nullSafe(l.getAddress()));
            row.createCell(5).setCellValue(nullSafe(l.getJewelryDescription()));
            row.createCell(6).setCellValue(nullSafe(l.getMetal()));
            row.createCell(7).setCellValue(l.getWeight() != null ? l.getWeight().doubleValue() : 0.0);
            setCurrency(row, 8, l.getLoanAmount(), currencyStyle);
            row.createCell(9).setCellValue(
                    l.getIssueDate() != null ? l.getIssueDate().toString() : "");
            row.createCell(10).setCellValue(l.getCloseDate() != null ? l.getCloseDate().toString() : "");
            setCurrency(row, 11, l.getSettlementAmount(), currencyStyle);
            row.createCell(12).setCellValue(nullSafe(l.getStatus() != null ? l.getStatus().name() : null));
            row.createCell(13).setCellValue(nullSafe(l.getDescription()));
        }
        autoSize(loanSheet, loanCols.length);

        // ── Interest Payments ──
        Sheet paySheet = createTrackedSheet(wb, "Interest Payments");
        String[] payCols = {
                "Payment ID", "Loan ID", "Customer Name", "Amount Paid (₹)",
                "Payment Date", "Balance After (₹)"
        };
        writeHeader(paySheet, payCols, headerStyle);

        int payIdx = 1;
        for (InterestPayment p : payments) {
            Row row = paySheet.createRow(payIdx++);
            row.createCell(0).setCellValue(p.getId() != null ? p.getId() : 0L);
            row.createCell(1).setCellValue(p.getLoanId() != null ? p.getLoanId() : 0L);
            row.createCell(2).setCellValue(nullSafe(p.getCustomer_name()));
            setCurrency(row, 3, p.getAmountPaid(), currencyStyle);
            row.createCell(4).setCellValue(
                    p.getPaymentDate() != null ? p.getPaymentDate().toString() : "");
            setCurrency(row, 5, p.getBalanceAfter(), currencyStyle);
        }
        autoSize(paySheet, payCols.length);
    }

    // ─── Inventory sheet ──────────────────────────────────────────────────────

    private void writeInventorySheet(Workbook wb, List<Product> products,
            CellStyle headerStyle, CellStyle currencyStyle) {

        Sheet sheet = createTrackedSheet(wb, "Inventory");
        String[] cols = {
                "Product ID", "Name", "SKU",
                "Main Category", "Sub Category", "Material",
                "Purity", "Base Weight (g)", "Stock Qty"
        };
        writeHeader(sheet, cols, headerStyle);

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
            row.createCell(7).setCellValue(p.getBaseWeight() != null ? p.getBaseWeight().doubleValue() : 0.0);
            row.createCell(8).setCellValue(p.getStockQuantity() != null ? p.getStockQuantity() : 0);
        }
        autoSize(sheet, cols.length);
    }

    private void writeGoldData(Workbook wb, List<Product> products,
            CellStyle headerStyle, CellStyle currencyStyle) {

        Sheet sheet = createTrackedSheet(wb, "GoldProduct");
        String[] cols = {
                "Product ID", "Name", "SKU",
                "Main Category", "Sub Category", "Material",
                "Purity", "Base Weight (g)", "Stock Qty"
        };
        writeHeader(sheet, cols, headerStyle);

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
            row.createCell(7).setCellValue(p.getBaseWeight() != null ? p.getBaseWeight().doubleValue() : 0.0);
            row.createCell(8).setCellValue(p.getStockQuantity() != null ? p.getStockQuantity() : 0);
        }
        autoSize(sheet, cols.length);
    }

    private void writeSilverData(Workbook wb, List<Product> products,
            CellStyle headerStyle, CellStyle currencyStyle) {

        Sheet sheet = createTrackedSheet(wb, "SilverProduct");
        String[] cols = {
                "Product ID", "Name", "SKU",
                "Main Category", "Sub Category", "Material",
                "Base Weight (g)", "Stock Qty"
        };
        writeHeader(sheet, cols, headerStyle);

        int rowIdx = 1;
        for (Product p : products) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(p.getId() != null ? p.getId() : 0L);
            row.createCell(1).setCellValue(nullSafe(p.getName()));
            row.createCell(2).setCellValue(nullSafe(p.getSku()));
            row.createCell(3).setCellValue(nullSafe(p.getMainCategory()));
            row.createCell(4).setCellValue(nullSafe(p.getSubCategory()));
            row.createCell(5).setCellValue(nullSafe(p.getMaterial()));
            row.createCell(6).setCellValue(p.getBaseWeight() != null ? p.getBaseWeight().doubleValue() : 0.0);
            row.createCell(7).setCellValue(p.getStockQuantity() != null ? p.getStockQuantity() : 0);
        }
        autoSize(sheet, cols.length);
    }

    // ─── Sales sheet ──────────────────────────────────────────────────────────

    private void writeSalesSheet(Workbook wb, List<Sales> allSales, List<Saleitem> allItems,
            CellStyle headerStyle, CellStyle currencyStyle, CellStyle dateStyle) {

        // ── Sales invoices ──
        Sheet salesSheet = createTrackedSheet(wb, "Sales");
        String[] salesCols = {
                "Sale ID", "Sale Date", "Customer Name",
                "Customer Phone", "Customer Address",
                "Subtotal (₹)", "GST Amount (₹)", "Grand Total (₹)"
        };
        writeHeader(salesSheet, salesCols, headerStyle);

        int rowIdx = 1;
        for (Sales s : allSales) {
            Row row = salesSheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(s.getId() != null ? s.getId() : 0L);
            row.createCell(1).setCellValue(
                    s.getSaleDate() != null ? s.getSaleDate().toString() : "");
            row.createCell(2).setCellValue(nullSafe(s.getCustomerName()));
            row.createCell(3).setCellValue(nullSafe(s.getCustomerPhoneNo()));
            row.createCell(4).setCellValue(nullSafe(s.getCustomerAddress()));
            setCurrency(row, 5, s.getSubtotal(), currencyStyle);
            setCurrency(row, 6, s.getGstAmount(), currencyStyle);
            setCurrency(row, 7, s.getGrandTotal(), currencyStyle);
        }
        autoSize(salesSheet, salesCols.length);

        // ── Sale line items ──
        Sheet itemSheet = createTrackedSheet(wb, "Sale Items");
        String[] itemCols = {
                "Item ID", "Sale ID", "SKU", "Product Name",
                "Material", "Purity", "Weight (g)",
                "Quantity", "Price Per Piece (₹)", "Line Total (₹)"
        };
        writeHeader(itemSheet, itemCols, headerStyle);

        int itemRowIdx = 1;
        for (Saleitem item : allItems) {
            Row row = itemSheet.createRow(itemRowIdx++);
            row.createCell(0).setCellValue(item.getId() != null ? item.getId() : 0L);
            row.createCell(1).setCellValue(item.getSaleId() != null ? item.getSaleId() : 0L);
            row.createCell(2).setCellValue(nullSafe(item.getSku()));
            row.createCell(3).setCellValue(nullSafe(item.getProductName()));
            row.createCell(4).setCellValue(nullSafe(item.getMaterial()));
            row.createCell(5).setCellValue(nullSafe(item.getPurity()));
            row.createCell(6).setCellValue(item.getWeight() != null ? item.getWeight().doubleValue() : 0.0);
            row.createCell(7).setCellValue(item.getQuantity() != null ? item.getQuantity() : 0);
            setCurrency(row, 8, item.getPricePerPiece(), currencyStyle);
            setCurrency(row, 9, item.getLineTotal(), currencyStyle);
        }
        autoSize(itemSheet, itemCols.length);
    }

    // ─── Summary sheet ────────────────────────────────────────────────────────

    private void writeSummarySheet(Workbook wb,
            List<Loan> loans,
            List<InterestPayment> payments,
            List<Product> products,
            List<Sales> sales,
            List<Saleitem> items,
            CellStyle headerStyle,
            CellStyle currencyStyle,
            boolean includeLoan,
            boolean includeInventory,
            boolean includeSales) {

        Sheet sheet = createTrackedSheet(wb, "Summary");
        writeHeader(sheet, new String[] { "Category", "Metric", "Value" }, headerStyle);

        int ri = 1;

        // ── Loan summary ──
        if (includeLoan && loans != null && payments != null) {
            double totalLoanAmount = loans.stream()
                    .mapToDouble(l -> l.getLoanAmount() != null ? l.getLoanAmount().doubleValue() : 0.0).sum();
            double totalSettlement = loans.stream()
                    .filter(l -> l.getSettlementAmount() != null)
                    .mapToDouble(l -> l.getSettlementAmount().doubleValue()).sum();
            double totalInterestPaid = payments.stream()
                    .mapToDouble(p -> p.getAmountPaid() != null ? p.getAmountPaid().doubleValue() : 0.0).sum();
            long activeLoans = loans.stream()
                    .filter(l -> l.getStatus() == LoanStatus.ACTIVE).count();
            long closedLoans = loans.stream()
                    .filter(l -> l.getStatus() == LoanStatus.CLOSED).count();

            ri = addSummaryRow(sheet, ri, "Loans", "Total Loans", loans.size());
            ri = addSummaryRow(sheet, ri, "Loans", "Active Loans", activeLoans);
            ri = addSummaryRow(sheet, ri, "Loans", "Closed Loans", closedLoans);
            ri = addSummaryRow(sheet, ri, "Loans", "Total Loan Amount (₹)", totalLoanAmount);
            ri = addSummaryRow(sheet, ri, "Loans", "Total Interest Paid (₹)", totalInterestPaid);
            ri = addSummaryRow(sheet, ri, "Loans", "Total Settlement (₹)", totalSettlement);
            ri = addSummaryRow(sheet, ri, "Loans", "Total Payments Made", payments.size());
        }

        // ── Inventory summary ──
        if (includeInventory && products != null) {
            double totalStockWeight = products.stream()
                    .mapToDouble(p -> {
                        double weight = p.getBaseWeight() != null ? p.getBaseWeight().doubleValue() : 0.0;
                        int qty = p.getStockQuantity() != null ? p.getStockQuantity() : 0;
                        return weight * qty;
                    }).sum();
            int totalStockQty = products.stream()
                    .mapToInt(p -> p.getStockQuantity() != null ? p.getStockQuantity() : 0).sum();

            ri = addSummaryRow(sheet, ri, "Inventory", "Total Products", products.size());
            ri = addSummaryRow(sheet, ri, "Inventory", "Total Stock Qty", totalStockQty);
            ri = addSummaryRow(sheet, ri, "Inventory", "Total Stock Weight (g)", totalStockWeight);
        }

        // ── Sales summary ──
        if (includeSales && sales != null && items != null) {
            double totalRevenue = sales.stream()
                    .mapToDouble(s -> s.getGrandTotal() != null ? s.getGrandTotal().doubleValue() : 0.0).sum();
            double totalGst = sales.stream()
                    .mapToDouble(s -> s.getGstAmount() != null ? s.getGstAmount().doubleValue() : 0.0).sum();
            double totalSubtotal = sales.stream()
                    .mapToDouble(s -> s.getSubtotal() != null ? s.getSubtotal().doubleValue() : 0.0).sum();
            int totalItemsSold = items.stream()
                    .mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();

            ri = addSummaryRow(sheet, ri, "Sales", "Total Transactions", sales.size());
            ri = addSummaryRow(sheet, ri, "Sales", "Total Revenue (₹)", totalRevenue);
            ri = addSummaryRow(sheet, ri, "Sales", "Total GST (₹)", totalGst);
            ri = addSummaryRow(sheet, ri, "Sales", "Subtotal excl GST (₹)", totalSubtotal);
            ri = addSummaryRow(sheet, ri, "Sales", "Total Items Sold", totalItemsSold);
        }

        autoSize(sheet, 3);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Sheet createTrackedSheet(Workbook wb, String name) {
        Sheet sheet = wb.createSheet(name);
        if (sheet instanceof SXSSFSheet sxssfSheet) {
            sxssfSheet.trackAllColumnsForAutoSizing();
        }
        return sheet;
    }

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

    private void setCurrency(Row row, int col, Number value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value.doubleValue() : 0.0);
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
        DataFormat fmt = wb.createDataFormat();
        style.setDataFormat(fmt.getFormat("#,##0.00"));
        return style;
    }

    private CellStyle buildDateStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat fmt = wb.createDataFormat();
        style.setDataFormat(fmt.getFormat("yyyy-mm-dd"));
        return style;
    }
}