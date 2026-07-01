package com.ems.inventory.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.inventory.model.Goldrates;
import com.ems.inventory.service.GoldRateService;
import com.ems.inventory.service.SilverRateService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/gold-rate")
@RequiredArgsConstructor
public class GoldRateController {
   
    private final GoldRateService goldRateService;
    private final SilverRateService silverRateService;

    @GetMapping("/fetch-now")
    public ResponseEntity<String> fetchNow() {
        try {
            System.out.println("=== MANUAL FETCH TRIGGERED ===");
            // Tell the service to do the work
            goldRateService.fetchAndSaveGoldRate(); 
            return ResponseEntity.ok("Gold rate for 10g fetched and saved successfully!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<Goldrates> getLatestGoldRate() {
        try {
            // Ask the service for the latest rate
            Goldrates latestRate = goldRateService.getLatestGoldRate();
            
            if (latestRate == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(latestRate);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/update")
public ResponseEntity<String> updateGoldRate(@RequestBody Map<String, Object> payload) {
    try {
        Number rate = (Number) payload.get("rate"); // per 10g
        goldRateService.updateManualGoldRate(rate.doubleValue());
        return ResponseEntity.ok("Gold rate updated successfully");
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
    }
}

  @PostMapping("/silver/update")
    public ResponseEntity<String> updateSilverRate(@RequestBody Map<String, Object> payload) {
        try {
            Number rate = (Number) payload.get("rate");
            silverRateService.updateManualSilverRate(rate.doubleValue());
            return ResponseEntity.ok("Silver rate updated successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}