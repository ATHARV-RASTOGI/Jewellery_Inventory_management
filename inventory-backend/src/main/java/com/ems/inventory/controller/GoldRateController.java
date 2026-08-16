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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/gold-rate")
@RequiredArgsConstructor
public class GoldRateController {
   
    private final GoldRateService goldRateService;
    private final SilverRateService silverRateService;

    @GetMapping("/fetch-now")
    public ResponseEntity<String> fetchNow() {
        log.info("Manual gold rate fetch triggered");
        goldRateService.fetchOnStartupAsync();
        return ResponseEntity.ok("Gold rate fetch initiated in the background.");
    }

    @GetMapping("/latest")
    public ResponseEntity<Goldrates> getLatestGoldRate() {
       
            Goldrates latestRate = goldRateService.getLatestGoldRate();
            
            if (latestRate == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(latestRate);
      
    }

    @PostMapping("/update")
    public ResponseEntity<String> updateGoldRate(@RequestBody Map<String, Object> payload) {
        Number rate = (Number) payload.get("rate");
        if (rate == null) {
            throw new IllegalArgumentException("rate is required");
        }
        goldRateService.updateManualGoldRate(rate.doubleValue());
        return ResponseEntity.ok("Gold rate updated successfully");
    }

 
}