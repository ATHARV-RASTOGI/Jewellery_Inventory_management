package com.ems.inventory.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.inventory.model.Goldrates;
import com.ems.inventory.model.Silver;
import com.ems.inventory.service.GoldRateService;
import com.ems.inventory.service.ProductService;
import com.ems.inventory.service.SilverRateService;
import com.ems.loan.service.LoanService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final SilverRateService silverRateService;
    private final ProductService productService;
    private final LoanService loanService;
    private final GoldRateService goldRateService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        
        Goldrates latestRate = goldRateService.getLatestGoldRate();
        BigDecimal goldRatePerGram = BigDecimal.ZERO;

        Silver latestRatesilver = silverRateService.getLatestSilverRate();
        BigDecimal silverRatePerGram = BigDecimal.ZERO;

        if (latestRatesilver != null && latestRatesilver.getRates() != null) {
            silverRatePerGram = latestRatesilver.getRates().getInr();
        }

        if (latestRate != null && latestRate.getRates() != null) {
            goldRatePerGram = latestRate.getRates().getInr();
        }

        Map<String, Object> stats = new HashMap<>();
        
        stats.put("silverRatePerGram",       silverRatePerGram.setScale(0, RoundingMode.HALF_UP).longValue());
        stats.put("totalItemsInStock",       productService.getTotalItems());
        stats.put("activeLoansCount",        loanService.countActiveLoans());
        stats.put("totalOutstandingAmount",  loanService.getTotalLoanAmount());
        stats.put("goldRatePerGram",         goldRatePerGram.setScale(0, RoundingMode.HALF_UP).longValue());
        stats.put("totalInventoryValue",     productService.getTotalvalue());
        stats.put("lowStockItemsCount",      productService.getCountOfItemsWithLowStock());
        stats.put("inventoryChangePercent",  0.0);
        
        return ResponseEntity.ok(stats);
    }

    
}