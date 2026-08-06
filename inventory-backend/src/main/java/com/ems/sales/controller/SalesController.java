package com.ems.sales.controller;


import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ems.sales.model.Saleitem;
import com.ems.sales.model.Sales;
import com.ems.sales.service.SalesService;

    import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;

@RestController
@RequestMapping("/api/sales")
public class SalesController {
    private final SalesService salesService;

    public SalesController(SalesService salesService){
        this.salesService =salesService;
    }

    @GetMapping
    public ResponseEntity<List<Sales>> getAllSales() {
        return ResponseEntity.ok(salesService.getAllSales());
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<List<Saleitem>> getSalesItem(@PathVariable Long id){
        return ResponseEntity.ok(salesService.getItemsForSale(id));
    }

    @PostMapping
    public ResponseEntity<Sales>createSales(@RequestBody Map<String,Object> payload){
        Sales sale= new Sales();
        sale.setCustomerName((String) payload.get("customerName"));
        sale.setCustomerPhoneNo((String) payload.get("customerPhone"));  
        sale.setCustomerAddress((String) payload.get("customerAddress"));
    

     @SuppressWarnings("unchecked")
        List<Map<String, Object>> items =
            (List<Map<String, Object>>) payload.get("items");

        Sales created = salesService.createsales(sale, items);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/analytics/revenue-overview")
    public ResponseEntity<List<Map<String, Object>>> getRevenueOverview(){
        return ResponseEntity.ok(salesService.getMonthlyRevenue());
    }

    @GetMapping("/analytics/by-material")
    public ResponseEntity<List<Map<String,Object>>> getSalesByMaterial(){
         return ResponseEntity.ok(salesService.getSalesByMaterial());
    }

     @GetMapping("/analytics/recent")
    public ResponseEntity<List<Sales>> getRecentSales(@RequestParam(defaultValue = "10") int limit) {
        final int MAX_LIMIT = 100;
        if (limit < 1 || limit > MAX_LIMIT) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        return ResponseEntity.ok(salesService.getRecentSales(limit));
    }

    @GetMapping("/analytics/weekly")
    public ResponseEntity<List<Map<String, Object>>> getWeeklySales() {
    return ResponseEntity.ok(salesService.getWeeklySales());
    }


@ExceptionHandler(RuntimeException.class)
public ResponseEntity<String> handleRuntimeException(RuntimeException ex) {
    if (ex.getMessage().contains("Insufficient stock")) {
        // Return a 400 Bad Request with the specific error message
        return ResponseEntity.badRequest().body(ex.getMessage()); 
    }
    // Fallback for other runtime exceptions
    return ResponseEntity.internalServerError().body("An unexpected error occurred");
}
  
    
}
