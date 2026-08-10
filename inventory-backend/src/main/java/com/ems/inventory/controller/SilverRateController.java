package com.ems.inventory.controller;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ems.inventory.model.Silver;
import com.ems.inventory.service.SilverRateService;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/silver-rates")
@RequiredArgsConstructor
public class SilverRateController {

    private final SilverRateService silverRateService;

    @GetMapping("/latest")
    public ResponseEntity <Map<String,Object>> getLatestSilverRate(){
        try{
            Silver latestsilver = silverRateService.getLatestSilverRate();
            
            if (latestsilver== null){
                return ResponseEntity.notFound().build();
            }
            Map<String,Object>response = new HashMap<>();
            response.put("rate",latestsilver.getRates().getInr());
            return ResponseEntity.ok(response);
        }
        catch(Exception e){
            return ResponseEntity.internalServerError().build();
        }
    }
    @PostMapping("/update")
    public ResponseEntity<String> updateSilverRate(@RequestBody Map<String, Object> payload) {
        Number rate = (Number) payload.get("rate");
        if (rate == null) {
            throw new IllegalArgumentException("rate is required");
        }
        silverRateService.updateManualSilverRate(java.math.BigDecimal.valueOf(rate.doubleValue()));
        return ResponseEntity.ok("Silver rate updated successfully");
    }


}
