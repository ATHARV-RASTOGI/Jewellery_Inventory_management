package com.ems.Exportdata.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
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
import org.springframework.transaction.annotation.Transactional;

import com.ems.Exportdata.dto.ExportCriteria;
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
@Transactional(readOnly = true)
public class ExportService {

    private final LoanRepository loanRepo;
    private final InterestPaymentRepository interestPaymentRepo;
    private final SalesRepository salesRepo;
    private final SaleItemRepository saleItemRepo;
    private final ProductRepository proRepo;

    // ─── Main entry points ───────────────────────────────────────────────────

    public byte[] exportToExcel(ExportCriteria criteria) throws IOException {
        // Streaming workbook with row window of 100 to prevent heap memory exhaustion
        try (SXSSFWorkbook wb = new SXSSFWorkbook(100);
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            wb.setCompressTempFiles(true);

            CellStyle headerStyle = buildHeaderStyle(wb);
            CellStyle currencyStyle = buildCurrencyStyle(wb);
            CellStyle dateStyle = buildDateStyle(wb);

            // Fetch datasets once based on selected criteria
            List<Loan> loans = (criteria.loans() || criteria.summary()) ? loanRepo.findAll() : null;
            List<InterestPayment> payments = (criteria.loans() || criteria.summary()) ? interestPaymentRepo.findAll() : null;
            List<Product> products = (criteria.inventory() || criteria.summary() || criteria.gold() || criteria.silver())
                    ? proRepo.findAll()
                    : null;
            List<Sales> allSales = (criteria.sales() || criteria.summary()) ? salesRepo.findAllByOrderBySaleDateDesc() : null;
            List<Saleitem> allItems = (criteria.sales() || criteria.summary()) ? saleItemRepo.findAll() : null;

            if (criteria.loans() && loans != null && payments != null) {
                writeLoanSheet(wb, loans, payments, headerStyle, currencyStyle, dateStyle);
            }
            if (criteria.inventory() && products != null) {
                writeProductSheet(wb, "Inventory", products, headerStyle, currencyStyle);
            }
            if (criteria.gold() && products != null) {
                List<Product> goldProducts = products.stream()
                        .filter(p -> "Gold".equalsIgnoreCase(p.getMaterial()))
                        .toList();
                writeProductSheet(wb, "GoldProduct", goldProducts, headerStyle, currencyStyle);
            }
            if (criteria.silver() && products != null) {
                List<Product> silverProducts = products.stream()
                        .filter(p -> "Silver".equalsIgnoreCase(p.getMaterial()))
                        .toList();
                writeProductSheet(wb, "SilverProduct", silverProducts, headerStyle, currencyStyle);
            }
            if (criteria.sales() && allSales != null && allItems != null) {
                writeSalesSheet(wb, allSales, allItems, headerStyle, currencyStyle, dateStyle);
            }
            if (criteria.summary()) {
                writeSummarySheet(wb, loans, payments, products, allSales, allItems,
                        headerStyle, currencyStyle, criteria.loans(), criteria.inventory(), criteria.sales());
            }

            wb.write(out);
            wb.dispose(); // Clean up streaming temporary files on disk
            return out.toByteArray();
        }
    }

    /** Legacy overload to maintain backward compatibility */
    public byte[] exportToExcel(boolean includeLoan,
            boolean includeInventory,
            boolean includeSales,
            boolean includeSummary,
            boolean includeGold,
            boolean includeSilver) throws IOException {
        return exportToExcel(new ExportCriteria(includeLoan, includeInventory, includeSales, includeSummary, includeGold, includeSilver));
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
            setNumericCell(row, 0, l.getId());
            setTextCell(row, 1, l.getName());
            setTextCell(row, 2, l.getFatherName());
            setTextCell(row, 3, l.getMobileNo());
            setTextCell(row, 4, l.getAddress());
            setTextCell(row, 5, l.getJewelryDescription());
            setTextCell(row, 6, l.getMetal());
            setDoubleCell(row, 7, l.getWeight() != null ? l.getWeight().doubleValue() : null);
            setCurrency(row, 8, l.getLoanAmount(), currencyStyle);
            setDateCell(row, 9, l.getIssueDate(), dateStyle);
            setDateCell(row, 10, l.getCloseDate(), dateStyle);
            setCurrency(row, 11, l.getSettlementAmount(), currencyStyle);
            setTextCell(row, 12, l.getStatus() != null ? l.getStatus().name() : null);
            setTextCell(row, 13, l.getDescription());
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
            setNumericCell(row, 0, p.getId());
            setNumericCell(row, 1, p.getLoanId());
            setTextCell(row, 2, p.getCustomer_name());
            setCurrency(row, 3, p.getAmountPaid(), currencyStyle);
            setDateCell(row, 4, p.getPaymentDate(), dateStyle);
            setCurrency(row, 5, p.getBalanceAfter(), currencyStyle);
        }
        autoSize(paySheet, payCols.length);
    }

    // ─── Product sheet (Unified for Inventory, Gold, Silver) ───────────────────

    private void writeProductSheet(Workbook wb, String sheetName, List<Product> products,
            CellStyle headerStyle, CellStyle currencyStyle) {

        Sheet sheet = createTrackedSheet(wb, sheetName);
        String[] cols = {
                "Product ID", "Name", "SKU",
                "Main Category", "Sub Category", "Material",
                "Purity", "Base Weight (g)", "Stock Qty"
        };
        writeHeader(sheet, cols, headerStyle);

        int rowIdx = 1;
        for (Product p : products) {
            Row row = sheet.createRow(rowIdx++);
            setNumericCell(row, 0, p.getId());
            setTextCell(row, 1, p.getName());
            setTextCell(row, 2, p.getSku());
            setTextCell(row, 3, p.getMainCategory());
            setTextCell(row, 4, p.getSubCategory());
            setTextCell(row, 5, p.getMaterial());
            setTextCell(row, 6, p.getPurity());
            setDoubleCell(row, 7, p.getBaseWeight() != null ? p.getBaseWeight().doubleValue() : null);
            setNumericCell(row, 8, p.getStockQuantity());
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
            setNumericCell(row, 0, s.getId());
            setDateCell(row, 1, s.getSaleDate(), dateStyle);
            setTextCell(row, 2, s.getCustomerName());
            setTextCell(row, 3, s.getCustomerPhoneNo());
            setTextCell(row, 4, s.getCustomerAddress());
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
            setNumericCell(row, 0, item.getId());
            setNumericCell(row, 1, item.getSaleId());
            setTextCell(row, 2, item.getSku());
            setTextCell(row, 3, item.getProductName());
            setTextCell(row, 4, item.getMaterial());
            setTextCell(row, 5, item.getPurity());
            setDoubleCell(row, 6, item.getWeight() != null ? item.getWeight().doubleValue() : null);
            setNumericCell(row, 7, item.getQuantity());
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

    private void setTextCell(Row row, int col, String value) {
        if (value != null && !value.isBlank()) {
            row.createCell(col).setCellValue(value);
        }
    }

    private void setNumericCell(Row row, int col, Number value) {
        if (value != null) {
            row.createCell(col).setCellValue(value.longValue());
        }
    }

    private void setDoubleCell(Row row, int col, Double value) {
        if (value != null) {
            row.createCell(col).setCellValue(value);
        }
    }

    private void setDateCell(Row row, int col, LocalDate date, CellStyle dateStyle) {
        if (date != null) {
            Cell cell = row.createCell(col);
            cell.setCellValue(date);
            cell.setCellStyle(dateStyle);
        }
    }

    private void setCurrency(Row row, int col, Number value, CellStyle style) {
        if (value != null) {
            Cell cell = row.createCell(col);
            cell.setCellValue(value.doubleValue());
            cell.setCellStyle(style);
        }
    }

    private void autoSize(Sheet sheet, int colCount) {
        for (int i = 0; i < colCount; i++) {
            sheet.autoSizeColumn(i);
        }
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