package com.ems.sales.service;

import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.Exception.Custom_Exception.InsufficientQuantity;
import com.ems.Exception.Custom_Exception.ItemNotFountException;
import com.ems.inventory.model.Product;
import com.ems.inventory.repository.ProductRepository;
import com.ems.sales.model.Saleitem;
import com.ems.sales.model.Sales;
import com.ems.sales.repository.SaleItemRepository;
import com.ems.sales.repository.SalesRepository;

@Service
public class SalesService {

    private final ProductRepository productRepository;
     private final SalesRepository saleRepository;
    private final SaleItemRepository saleItemRepository;

    public SalesService(ProductRepository productRepository, SalesRepository saleRepository ,SaleItemRepository saleItemRepository){
        this.productRepository=productRepository;
        this.saleItemRepository=saleItemRepository;
        this.saleRepository = saleRepository;
    }

    public List<Sales> getAllSales(){
        return saleRepository.findAllByOrderBySaleDateDesc();
    }

    public List<Saleitem> getItemsForSale(Long saleId) {
        return saleItemRepository.findBySale_IdOrderById(saleId);
    }

    @Transactional(rollbackFor = Exception.class)
    public Sales createsales(Sales sale, List<Map<String,Object>>items){
        Sales savedsale= saleRepository.save(sale);

        double subtotal=0.0;

        for(Map<String, Object> item : items){
            String sku= (String)item.get("sku");
            int quantity = ((Number) item.get("quantity")).intValue();
            double pricePerPiece = ((Number) item.get("pricePerPiece")).doubleValue();
        

        Product product= productRepository.findBySkuForUpdate(sku).orElseThrow(()-> new ItemNotFountException("Item not found for sku : " + sku));
        if (product.getStockQuantity() < quantity || quantity < 0) {
            if (quantity < 0) {
                throw new IllegalArgumentException("Invalid Sales : Quantity Can't Be Negative !");
            }
            throw new InsufficientQuantity("Insufficient stock for: " + sku);
        }


            
        product.setStockQuantity(product.getStockQuantity() - quantity);
        productRepository.save(product);

        Saleitem saleitem = new Saleitem();

        saleitem.setSale(savedsale);
        saleitem.setSku(sku);
        saleitem.setProductName(product.getName());
        saleitem.setMaterial(product.getMaterial());
        saleitem.setPurity(product.getPurity());
        saleitem.setWeight(product.getBaseWeight());
        saleitem.setQuantity(quantity);
        saleitem.setPricePerPiece(pricePerPiece);
        saleitem.setLineTotal(pricePerPiece * quantity);
        saleItemRepository.save(saleitem);
        // keep both sides of the relationship in sync
        savedsale.getItems().add(saleitem);

        subtotal += pricePerPiece * quantity;
        }

        double gst = subtotal * 0.03;
        savedsale.setSubtotal(subtotal);
        savedsale.setGstAmount(gst);
        savedsale.setGrandTotal(subtotal + gst);

        Sales finalSale = saleRepository.save(savedsale);
        // populate transient itemCount without loading the collection
        finalSale.setItemCount((int) saleItemRepository.countBySale_Id(finalSale.getId()));
        return finalSale;

    }

    public List<Map<String,Object>> getMonthlyRevenue(){
        int currentYear = LocalDate.now().getYear();
        LocalDate start = LocalDate.of(currentYear, 1, 1);
        LocalDate end = LocalDate.now();

        Map<Month, Double> monthlyTotal = new LinkedHashMap<>();
        for (Month m : Month.values()) {
            monthlyTotal.put(m, 0.0);
        }

        List<Object[]> rows = saleRepository.findMonthlyRevenueBetween(start, end);
        for (Object[] r : rows) {
            Integer monthIndex = ((Number) r[0]).intValue(); // 1-12
            Double sum = ((Number) r[1]).doubleValue();
            Month m = Month.of(monthIndex);
            monthlyTotal.put(m, sum);
        }

        List<Map<String,Object>> result = new ArrayList<>();
        for(Map.Entry<Month, Double> entry : monthlyTotal.entrySet()){
            Map<String ,Object>point = new HashMap<>();
            point.put("month", entry.getKey().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            point.put("revenue", Math.round(entry.getValue()));
            result.add(point);
        }
        return result;
    }

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

public List<Sales> getRecentSales(int limit) {
    int bounded = Math.max(0, limit);
    Page<Sales> page = saleRepository.findAllByOrderBySaleDateDesc(PageRequest.of(0, bounded));
    List<Sales> sales = page.getContent();

    if (sales.isEmpty()) {
        return sales;
    }

    List<Long> salesId = new ArrayList<>();
    for(Sales s : sales){
        salesId.add(s.getId());
    }

    // 2. Fetch the item counts for ALL of these sales in exactly ONE query
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
    
    return sales;
}


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
}
