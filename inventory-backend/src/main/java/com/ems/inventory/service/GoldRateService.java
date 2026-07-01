package com.ems.inventory.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.ems.inventory.model.Goldrates;
import com.ems.inventory.model.Rates;
import com.ems.inventory.repository.GoldRateRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class GoldRateService {

    @Value("${goldapi.key}")
    private String apiKey;

    private final GoldRateRepository goldRateRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    // We use XAU/INR directly to get the most accurate currency conversion
    private final static String GOLD_API_URL = "https://www.goldapi.io/api/XAU/INR/";
    
    private static final double OUNCE_TO_GRAMS = 31.1035;

    // MCX ADJUSTMENT: International spot price + Import Duty (~15%) + GST (~3%)
    // Adjust this multiplier (e.g., 1.18 = +18%) to match today's MCX price exactly.
    private static final double INDIAN_MARKET_MULTIPLIER = 1.18;

    @PostConstruct
    public void fetchOnStartup() {
        System.out.println("=== SERVER STARTED: TRIGGERING INITIAL GOLD RATE FETCH ===");
        fetchAndSaveGoldRate();
    }

    // Runs every hour exactly on the hour (e.g., 1:00, 2:00, 3:00)
    @Scheduled(cron = "0 0 11 * * ? ", zone = "Asia/Kolkata")
    public void fetchAndSaveGoldRate() {
        try {
            System.out.println("=== FETCHING LIVE GOLD RATE FROM API ===");

           
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-access-token", apiKey);
            headers.set("Content-Type", "application/json");

            HttpEntity<String> entity = new HttpEntity<>(headers);

            // 2. Make the live HTTP GET Request
            ResponseEntity<Map> response = restTemplate.exchange(
                    GOLD_API_URL,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getBody() != null && response.getBody().containsKey("price")) {
                
                double livePricePerOunceInr = Double.parseDouble(response.getBody().get("price").toString());
                System.out.println("API Success! Live Spot Price (1 Ounce INR): ₹" + livePricePerOunceInr);
                
                updateLocalGoldRate(livePricePerOunceInr);
            } else {
                System.err.println("API responded, but 'price' data was missing.");
            }

        } catch (NumberFormatException | RestClientException e) {
            System.err.println("API FETCH ERROR: " + e.getMessage());
        }
    }

    private void updateLocalGoldRate(double currentPricePerOunceInr) {
        try {
            System.out.println("=== SAVING LIVE GOLD RATE TO DATABASE ===");
            Goldrates goldRate = new Goldrates();
            goldRate.setTimestamp(java.time.LocalDateTime.now().toString());
            goldRate.setBase("INR");

            Rates rates = new Rates();

       
            double raw10gPriceInr = (currentPricePerOunceInr / OUNCE_TO_GRAMS) * 10;
            
          
            double mcxAdjusted10gPrice = raw10gPriceInr * INDIAN_MARKET_MULTIPLIER;

            rates.setInr(mcxAdjusted10gPrice);
            

            goldRate.setRates(rates);

            Goldrates saved = goldRateRepository.save(goldRate);
            System.out.println("SAVED successfully! LIVE 10g MCX-Adjusted INR: ₹" + Math.round(mcxAdjusted10gPrice));

        } catch (Exception e) {
            System.err.println("SAVE ERROR: " + e.getMessage());
        }
    }

    public Goldrates getLatestGoldRate() {
        return goldRateRepository.getLatestGoldRate();
 
 
    }  
    
    public void updateManualGoldRate(double per10gRate) {

    Goldrates goldRate = new Goldrates();
    
    goldRate.setTimestamp(java.time.LocalDateTime.now().toString());
    goldRate.setBase("INR");

    Rates rates = new Rates();
    rates.setInr(per10gRate);  // store as-is, already per 10g
    goldRate.setRates(rates);

    goldRateRepository.save(goldRate);
    System.out.println("Manual gold rate updated: ₹" + per10gRate + " per 10g");
}

    
}