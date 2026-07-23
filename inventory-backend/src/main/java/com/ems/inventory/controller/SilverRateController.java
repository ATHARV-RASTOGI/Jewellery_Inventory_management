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

    public final SilverRateService silverrateservice;

    @GetMapping("/latest")
    public ResponseEntity <Map<String,Object>> getLatestSilverRate(){
        try{
            Silver latestsilver = silverrateservice.getLatestSilverRate();
            
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
        try {
            Number rate = (Number) payload.get("rate");
            silverrateservice.updateManualSilverRate(rate.doubleValue());
            return ResponseEntity.ok("Silver rate updated successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }


}
