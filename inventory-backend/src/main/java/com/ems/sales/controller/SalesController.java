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

import com.ems.sales.dto.SalesRequestDTO;
import com.ems.sales.dto.SalesResponseDTO;
import com.ems.sales.dto.SalesitemResponseDTO;
import com.ems.sales.service.SalesService;

@RestController
@RequestMapping("/api/sales")
public class SalesController {
    private final SalesService salesService;

    public SalesController(SalesService salesService) {
        this.salesService = salesService;
    }

    @GetMapping
    public ResponseEntity<List<SalesResponseDTO>> getAllSales() {
        return ResponseEntity.ok(salesService.getAllSales());
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<List<SalesitemResponseDTO>> getSalesItem(@PathVariable Long id) {
        return ResponseEntity.ok(salesService.getItemsForSale(id));
    }

    @PostMapping
    public ResponseEntity<SalesResponseDTO> createSales(@RequestBody SalesRequestDTO request) {

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Sale must contain at least one item");
        }

        SalesResponseDTO created = salesService.createsales(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/analytics/revenue-overview")
    public ResponseEntity<List<Map<String, Object>>> getRevenueOverview() {
        return ResponseEntity.ok(salesService.getMonthlyRevenue());
    }

    @GetMapping("/analytics/by-material")
    public ResponseEntity<List<Map<String, Object>>> getSalesByMaterial() {
        return ResponseEntity.ok(salesService.getSalesByMaterial());
    }

    @GetMapping("/analytics/weekly")
    public ResponseEntity<List<Map<String, Object>>> getWeeklySales() {
        return ResponseEntity.ok(salesService.getWeeklySales());
    }

    @GetMapping("/analytics/recent")
    public ResponseEntity<List<SalesResponseDTO>> getRecentSales(@RequestParam(defaultValue = "10") int limit) {
        final int MAX_LIMIT = 100;
        if (limit < 1 || limit > MAX_LIMIT) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        return ResponseEntity.ok(salesService.getRecentSales(limit));
    }

}
