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
    BigDecimal goldRatePer10g = BigDecimal.ZERO;

    Silver latestRatesilver = silverRateService.getLatestSilverRate();
    BigDecimal silverRatePer10g = BigDecimal.ZERO;

    if (latestRatesilver != null && latestRatesilver.getRates() != null && latestRatesilver.getRates().getInr() != null) {
        silverRatePer10g = latestRatesilver.getRates().getInr();
    }

    if (latestRate != null && latestRate.getRates() != null && latestRate.getRates().getInr() != null) {
        goldRatePer10g = latestRate.getRates().getInr();
    }

    BigDecimal goldRatePerGram = goldRatePer10g.divide(BigDecimal.TEN, 2, RoundingMode.HALF_UP);
    BigDecimal silverRatePerGram = silverRatePer10g.divide(BigDecimal.TEN, 2, RoundingMode.HALF_UP);

    Map<String, Object> stats = new HashMap<>();
    stats.put("silverRatePerGram",       silverRatePerGram.setScale(0, RoundingMode.HALF_UP).longValue());
    stats.put("silverRatePer10Gram",     silverRatePer10g.setScale(0, RoundingMode.HALF_UP).longValue());
    stats.put("goldRatePerGram",         goldRatePerGram.setScale(0, RoundingMode.HALF_UP).longValue());
    stats.put("goldRatePer10Gram",       goldRatePer10g.setScale(0, RoundingMode.HALF_UP).longValue());
    stats.put("totalItemsInStock",       productService.getTotalItems());
    stats.put("activeLoansCount",        loanService.countActiveLoans());
    stats.put("totalOutstandingAmount",  loanService.getTotalLoanAmount());
    stats.put("totalInventoryValue",     productService.getTotalvalue());
    stats.put("lowStockItemsCount",      productService.getCountOfItemsWithLowStock());
    stats.put("inventoryChangePercent",  0.0);

    return ResponseEntity.ok(stats);
    }
}