package com.ems.component;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.ems.custom_order.service.CustomOrderService;
import com.ems.inventory.service.GoldRateService;
import com.ems.inventory.service.ProductService;
import com.ems.inventory.service.SilverRateService;
import com.ems.loan.service.LoanService;
import com.ems.sales.service.SalesService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheWarmup {

    private final GoldRateService goldRateService;
    private final SilverRateService silverRateService;
    private final ProductService productService;
    private final LoanService loanService;
    private final SalesService salesService;
    private final CustomOrderService customerOrderService;

    @Async
    @EventListener(ApplicationReadyEvent.class)
    @Order(3)
    public void warmUpCaches() {
        log.info(">>> Cache warm-up started...");

        // Rates (used by dashboard + sales pricing)
        goldRateService.getLatestGoldRate();
        silverRateService.getLatestSilverRate();

        // Dashboard metrics
        productService.getTotalItems();
        productService.getTotalvalue();
        productService.getCountOfItemsWithLowStock();
        loanService.getTotalLoanAmount();
        loanService.countActiveLoans();

        // Full lists (preload so first page visit is instant)
        productService.getFilterProducts(null, null, null, null);

        // Dashboard charts
        salesService.getMonthlyRevenue();
        salesService.getSalesByMaterial();
        salesService.getWeeklySales();
        salesService.getRecentSales(5);

        // Customer orders
        customerOrderService.getAllCustomOrder();

        log.info(">>> Cache warm-up complete!");
    }
}
