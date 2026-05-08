package com.ems.inventory.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

import com.ems.inventory.service.LoanService;
import com.ems.inventory.service.ProductService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor          // ← auto-generates constructor for all final fields
public class DashboardController {

    private final ProductService productService;
    private final LoanService loanService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalInventoryValue",     productService.getTotalvalue());
        stats.put("totalItemsInStock",       productService.getTotalItems());
        stats.put("activeLoansCount",        loanService.getAllLoans().size());
        stats.put("totalOutstandingAmount",  productService.getTotalLoanAmount());
        stats.put("goldRatePerGram",         productService.getliveGoldRate());
        stats.put("lowStockItemsCount",      productService.getCountOfItemsWithLowStock());
        stats.put("inventoryChangePercent",  0.0);
        return ResponseEntity.ok(stats);
    }
}