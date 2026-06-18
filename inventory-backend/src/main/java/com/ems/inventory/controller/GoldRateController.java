package com.ems.inventory.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.inventory.model.Goldrates;
import com.ems.inventory.service.GoldRateService;

@RestController
@RequestMapping("/api/gold-rate")
public class GoldRateController {

    // Inject the brains (Service) into the receptionist (Controller)
    @Autowired
    private GoldRateService goldRateService;

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
}