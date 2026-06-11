package com.ems.inventory.service;

import java.util.Map;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.ems.inventory.model.Rates;
import com.ems.inventory.model.Silver;
import com.ems.inventory.repository.SilverRateRepository;

import jakarta.annotation.PostConstruct;

@Service
public class SilverRateService {

    private final SilverRateRepository silverRateRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    // We use XAU/INR directly to get the most accurate currency conversion
    private final static String SILVER_API_URL = "https://www.goldapi.io/api/XAG/INR/";
    
    // YOUR LIVE API KEY
    private final static String API_KEY = "goldapi-2dfb4fc06b25112540f024a99aa7cec7-io";

    private static final double OUNCE_TO_GRAMS = 31.1035;

    private static final double INDIAN_MARKET_MULTIPLIER = 1.18;

    SilverRateService(SilverRateRepository silverRateRepository) {
        this.silverRateRepository = silverRateRepository;
    }

    @PostConstruct
    public void fetchOnStartup(){
        System.out.println("=== SERVER STARTED: TRIGGERING INITIAL SILVER RATE FETCH ===");
        fetchAndSaveSilverRate();
    }
    
    @Scheduled(cron = "0 0 * * * ?")
    public void fetchAndSaveSilverRate(){
        try{
            System.out.println("=== FETCHING LIVE SILVER RATE FROM API ===");
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-access-token", API_KEY);
            headers.set("Content-Type", "application/json");

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                SILVER_API_URL,
                HttpMethod.GET,
                entity,
                Map.class
            );

            if(response.getBody() != null && response.getBody().containsKey("price")){
                double liveprice= Double.parseDouble(response.getBody().get("price").toString());
                 System.out.println("API Success! Live Spot Silver Price (1 Ounce INR): ₹" + liveprice);
                
                updatesilverrate(liveprice);
            }
            else{
                 System.err.println("API responded, but silver 'price' data was missing.");
            }
             } catch (NumberFormatException | RestClientException e) {
            System.err.println("API FETCH ERROR: " + e.getMessage());
        }
    }
    private void updatesilverrate(double liveprice) {
        try {
            Silver silver= new Silver();
            silver.setTimestamp(java.time.LocalDateTime.now().toString());
            silver.setBase("INR");

            Rates rate= new Rates();
            double raw10gPriceInr = ( liveprice/ OUNCE_TO_GRAMS) * 10;
            
          
            double mcxAdjusted10gPrice = raw10gPriceInr * INDIAN_MARKET_MULTIPLIER;
            rate.setInr(mcxAdjusted10gPrice);
           
            silver.setRates(rate);
            silverRateRepository.save(silver);

        } catch (Exception e) {
             System.err.println("SAVE ERROR: " + e.getMessage());
        }
    }
    public Silver getLatestSilverRate() {
        return silverRateRepository.getLatestsilver();
    }   
}