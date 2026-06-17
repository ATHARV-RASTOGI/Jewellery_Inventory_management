package com.ems.inventory.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.inventory.model.Goldrates;
import com.ems.inventory.model.Silver;
import com.ems.inventory.service.GoldRateService;
import com.ems.inventory.service.LoanService;
import com.ems.inventory.service.ProductService;
import com.ems.inventory.service.SilverRateService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor // Still using your awesome Lombok setup!
public class DashboardController {

    private final SilverRateService silverRateService;
    private final ProductService productService;
    private final LoanService loanService;
    private final GoldRateService goldRateService;

    // DashboardController(SilverRateService silverRateService) {
    //     this.silverRateService = silverRateService;
    // } 

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        
        Goldrates latestRate = goldRateService.getLatestGoldRate();
        double goldRatePerGram = 0.0;

        Silver latestRatesilver = silverRateService.getLatestSilverRate();
        double SilverRatePerGram = 0.0;
        

         if (latestRatesilver != null && latestRatesilver.getRates() != null) {
            SilverRatePerGram = latestRatesilver.getRates().getInr();
        }

        
        if (latestRate != null && latestRate.getRates() != null) {
            goldRatePerGram = latestRate.getRates().getInr();
        }

        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalInventoryValue",    Math.round(SilverRatePerGram));
        stats.put("totalItemsInStock",       productService.getTotalItems());
        stats.put("activeLoansCount",        loanService.getAll().size());
        stats.put("totalOutstandingAmount",  loanService.getTotalLoanAmount());
        
        // 3. Send the properly calculated math rounded to a clean number
        stats.put("goldRatePerGram",         Math.round(goldRatePerGram)); 
        
        stats.put("lowStockItemsCount",      productService.getCountOfItemsWithLowStock());
        stats.put("inventoryChangePercent",  0.0);
        
        return ResponseEntity.ok(stats);
    }

    
}