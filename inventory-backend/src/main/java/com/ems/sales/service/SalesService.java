package com.ems.sales.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.Exception.Custom_Exception.ItemNotFoundException;
import com.ems.gst.model.HsnMaster;
import com.ems.gst.repository.HsnMasterRepository;
import com.ems.inventory.model.Goldrates;
import com.ems.inventory.model.Product;
import com.ems.inventory.model.Silver;
import com.ems.inventory.repository.GoldRateRepository;
import com.ems.inventory.repository.SilverRateRepository;
import com.ems.inventory.service.StockService;
import com.ems.sales.dto.SalesRequestDTO;
import com.ems.sales.dto.SalesResponseDTO;
import com.ems.sales.dto.SalesitemRequestDTO;
import com.ems.sales.dto.SalesitemResponseDTO;
import com.ems.sales.model.Saleitem;
import com.ems.sales.model.Sales;
import com.ems.sales.repository.SaleItemRepository;
import com.ems.sales.repository.SalesRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SalesService {

    private final StockService stockService;
    private final SalesRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final GoldRateRepository goldRateRepository;
    private final SilverRateRepository silverRateRepository;
    private final ModelMapper modelMapper;
    private final HsnMasterRepository hsnMasterRepository;

    private static final BigDecimal GST_RATE = new BigDecimal("0.03");
    private static final int CURRENCY_SCALE = 2;
    private static final BigDecimal DEFAULT_GOLD_MAKING_PERCENT = new BigDecimal("12.0");
    private static final BigDecimal DEFAULT_SILVER_MAKING_PERCENT = new BigDecimal("8.0");

    @Cacheable(value = "sales_analytics", key = "'all_sales'")
    public List<SalesResponseDTO> getAllSales() {
        List<Sales> sales = saleRepository.findAllByOrderBySaleDateDesc();
        return sales.stream().map(sale -> modelMapper.map(sale, SalesResponseDTO.class)).toList();
    }

    public List<SalesitemResponseDTO> getItemsForSale(Long saleId) {
        return saleItemRepository.findBySale_IdOrderById(saleId).stream()
                .map(sale -> modelMapper.map(sale, SalesitemResponseDTO.class)).toList();
    }


    @CacheEvict(value = {"sales_analytics", "products", "inventory_metrics"}, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    public SalesResponseDTO createsales(SalesRequestDTO request) {

        Sales sale = new Sales();
        sale.setCustomerName(request.getCustomerName());
        sale.setCustomerPhoneNo(request.getCustomerPhoneNo());
        sale.setCustomerAddress(request.getCustomerAddress());
        sale.setCustomerGstin(request.getCustomerGstin());
        Sales savedSale = saleRepository.save(sale);
        BigDecimal subtotal = BigDecimal.ZERO;

        for (SalesitemRequestDTO item : request.getItems()) {
            String sku = item.getSku();
            int quantity = item.getQuantity() != null ? item.getQuantity() : 0;

            Product product = stockService.reserveAndDeduct(sku, quantity, item.getWeight());

            // Extract pricing parameters from payload if provided
            BigDecimal appliedRatePer10g = item.getAppliedRatePer10g();
            BigDecimal makingChargePercent = item.getMakingChargePercent();
            BigDecimal makingChargeAmount = item.getMakingChargeAmount();
            BigDecimal pricePerPiece = item.getPricePerPiece();

            String material = product.getMaterial() != null ? product.getMaterial().trim() : "Gold";
            BigDecimal weight = item.getWeight() != null ? item.getWeight() : BigDecimal.ZERO;
            String purity = product.getPurity();

            // 1. Resolve applied rate per 10g
            if (appliedRatePer10g == null || appliedRatePer10g.compareTo(BigDecimal.ZERO) <= 0) {
                if ("Silver".equalsIgnoreCase(material)) {
                    appliedRatePer10g = getLatestLiveSilverRate();
                } else {
                    appliedRatePer10g = getLatestLiveGoldRate();
                }
            }

            // 2. Resolve making charge %
            if (makingChargePercent == null) {
                makingChargePercent = "Silver".equalsIgnoreCase(material)
                        ? DEFAULT_SILVER_MAKING_PERCENT
                        : DEFAULT_GOLD_MAKING_PERCENT;
            }

            HsnMaster hsnCode = hsnMasterRepository.findByMaterialKeyIgnoreCase(material)
                    .orElseThrow(() -> new ItemNotFoundException("HSN Master not found for material: " + material));
            
            // 3. Resolve pricePerPiece and makingChargeAmount if not supplied
            BigDecimal purityFactor = getPurityFactor(material, purity);
            BigDecimal ratePerGram = appliedRatePer10g.divide(BigDecimal.TEN, 4, RoundingMode.HALF_UP);
            BigDecimal metalValue = weight.multiply(ratePerGram).multiply(purityFactor);

            if (makingChargeAmount == null) {
                makingChargeAmount = metalValue.multiply(makingChargePercent)
                        .divide(BigDecimal.valueOf(100), CURRENCY_SCALE, RoundingMode.HALF_UP);
            }

            if (pricePerPiece == null || pricePerPiece.compareTo(BigDecimal.ZERO) <= 0) {
                pricePerPiece = metalValue.add(makingChargeAmount).setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
            }

            BigDecimal lineTotal = pricePerPiece.multiply(BigDecimal.valueOf(quantity)).setScale(CURRENCY_SCALE,
                    RoundingMode.HALF_UP);

            Saleitem saleitem = new Saleitem();
            saleitem.setSale(savedSale);
            saleitem.setSku(sku);
            saleitem.setProductName(product.getName());
            saleitem.setMaterial(product.getMaterial());
            saleitem.setPurity(product.getPurity());
            saleitem.setWeight(weight);
            saleitem.setQuantity(quantity);
            saleitem.setAppliedRatePer10g(appliedRatePer10g);
            saleitem.setMakingChargePercent(makingChargePercent);
            saleitem.setMakingChargeAmount(makingChargeAmount);
            saleitem.setPricePerPiece(pricePerPiece);
            saleitem.setLineTotal(lineTotal);
            saleitem.setHsnCode(hsnCode.getHsnCode());

            saleItemRepository.save(saleitem);
            savedSale.getItems().add(saleitem);

            subtotal = subtotal.add(lineTotal);
        }

       BigDecimal gst = subtotal.multiply(GST_RATE).setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);
        BigDecimal cgst = gst.divide(BigDecimal.valueOf(2), CURRENCY_SCALE, RoundingMode.HALF_UP);
        BigDecimal sgst = gst.subtract(cgst); 
        BigDecimal grandTotal = subtotal.add(gst).setScale(CURRENCY_SCALE, RoundingMode.HALF_UP);

        String invoiceNumber = generateInvoiceNumber();

        savedSale.setSubtotal(subtotal);
        savedSale.setCgstAmount(cgst);
        savedSale.setSgstAmount(sgst);
        savedSale.setGstAmount(gst);
        savedSale.setGrandTotal(grandTotal);
        savedSale.setInvoiceNumber(invoiceNumber);

         Sales finalSale = saleRepository.save(savedSale);
        finalSale.setItemCount((int) saleItemRepository.countBySale_Id(finalSale.getId()));
        
        return modelMapper.map(finalSale, SalesResponseDTO.class);
    }


     private String generateInvoiceNumber() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        int month = today.getMonthValue();

        int startYear = (month >= 4) ? year : year - 1;
        int endYear = (startYear + 1) % 100; 

        String financialYear = startYear + "-" + String.format("%02d", endYear); 
        
        long count = saleRepository.count() + 1;
        return String.format("INV/%s/%04d", financialYear, count); // e.g., "INV/2026-27/0001"
    }


    private BigDecimal getPurityFactor(String material, String purity) {
        if ("Silver".equalsIgnoreCase(material)) {
            return BigDecimal.ONE;
        }
        if (purity == null)
            return BigDecimal.ONE;
        String p = purity.trim().toUpperCase();
        if (p.contains("24K"))
            return BigDecimal.ONE;
        if (p.contains("22K"))
            return new BigDecimal("22").divide(new BigDecimal("24"), 6, RoundingMode.HALF_UP);
        if (p.contains("20K"))
            return new BigDecimal("20").divide(new BigDecimal("24"), 6, RoundingMode.HALF_UP);
        if (p.contains("18K"))
            return new BigDecimal("18").divide(new BigDecimal("24"), 6, RoundingMode.HALF_UP);
        if (p.contains("14K"))
            return new BigDecimal("14").divide(new BigDecimal("24"), 6, RoundingMode.HALF_UP);
        return new BigDecimal("22").divide(new BigDecimal("24"), 6, RoundingMode.HALF_UP);
    }

    private BigDecimal getLatestLiveGoldRate() {
        Optional<Goldrates> opt = goldRateRepository.findFirstByOrderByTimestampDesc();
        if (opt.isPresent() && opt.get().getRates() != null && opt.get().getRates().getInr() != null) {
            return opt.get().getRates().getInr();
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal getLatestLiveSilverRate() {
        Optional<Silver> opt = silverRateRepository.findFirstByOrderByTimestampDesc();
        if (opt.isPresent() && opt.get().getRates() != null && opt.get().getRates().getInr() != null) {
            return opt.get().getRates().getInr();
        }
        return BigDecimal.ZERO;
    }

    @Cacheable(value = "sales_analytics", key = "'monthly_revenue'")
    public List<Map<String, Object>> getMonthlyRevenue() {
        int currentYear = LocalDate.now().getYear();
        LocalDate start = LocalDate.of(currentYear, 1, 1);
        LocalDate end = LocalDate.now();

        Map<Month, Double> monthlyTotal = new LinkedHashMap<>();
        for (Month m : Month.values()) {
            monthlyTotal.put(m, 0.0);
        }

        List<Object[]> rows = saleRepository.findMonthlyRevenueBetween(start, end);
        for (Object[] r : rows) {
            Integer monthIndex = ((Number) r[0]).intValue();
            Double sum = ((Number) r[1]).doubleValue();
            Month m = Month.of(monthIndex);
            monthlyTotal.put(m, sum);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<Month, Double> entry : monthlyTotal.entrySet()) {
            Map<String, Object> point = new HashMap<>();
            point.put("month", entry.getKey().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("revenue", Math.round(entry.getValue()));
            result.add(point);
        }
        return result;
    }

    @Cacheable(value = "sales_analytics", key = "'sales_by_material'")
    public List<Map<String, Object>> getSalesByMaterial() {
        int currentYear = LocalDate.now().getYear();
        LocalDate start = LocalDate.of(currentYear, 1, 1);
        LocalDate end = LocalDate.now();

        List<Object[]> rows = saleItemRepository.findMaterialTotalsBetween(start, end);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            String material = (String) r[0];
            Double value = ((Number) r[1]).doubleValue();
            Map<String, Object> point = new HashMap<>();
            point.put("material", material);
            point.put("value", Math.round(value));
            result.add(point);
        }
        return result;
    }

    @Cacheable(value = "sales_analytics" , key = "'weekly_sales'")
    public List<Map<String, Object>> getWeeklySales() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);

        Map<LocalDate, Double> dailyTotals = new LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            dailyTotals.put(weekStart.plusDays(i), 0.0);
        }

        List<Object[]> rows = saleRepository.findDailyRevenueBetween(weekStart, today);
        for (Object[] r : rows) {
            LocalDate date = (LocalDate) r[0];
            Double sum = ((Number) r[1]).doubleValue();
            dailyTotals.put(date, sum);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<LocalDate, Double> entry : dailyTotals.entrySet()) {
            Map<String, Object> point = new HashMap<>();
            point.put("day", entry.getKey().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("sales", Math.round(entry.getValue()));
            result.add(point);
        }
        return result;
    }

    @Cacheable(value = "sales_analytics", key = "'recent_sales_' + #limit")
    public List<SalesResponseDTO> getRecentSales(int limit) {
        int bounded = Math.max(0, limit);
        Page<Sales> page = saleRepository.findAllByOrderBySaleDateDesc(PageRequest.of(0, bounded));
        List<Sales> sales = page.getContent();

        if (sales.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> salesId = new ArrayList<>();
        for (Sales s : sales) {
            salesId.add(s.getId());
        }

        List<Object[]> counts = saleItemRepository.countItemsForSales(salesId);
        Map<Long, Integer> countMap = new HashMap<>();
        for (Object[] row : counts) {
            Long saleId = (Long) row[0];
            Integer count = ((Number) row[1]).intValue();
            countMap.put(saleId, count);
        }

        for (Sales s : sales) {
            s.setItemCount(countMap.getOrDefault(s.getId(), 0));
        }

        return sales.stream()
                .map(s -> modelMapper.map(s, SalesResponseDTO.class))
                .toList();
    }

}
