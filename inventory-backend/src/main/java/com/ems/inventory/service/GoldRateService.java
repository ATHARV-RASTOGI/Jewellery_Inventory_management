package com.ems.inventory.service;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GoldRateService {

    @Value("${goldapi.key}")
    private String apiKey;

    private final GoldRateRepository goldRateRepository;
    private final RestTemplate restTemplate;

    // We use XAU/INR directly to get the most accurate currency conversion
    private final static String GOLD_API_URL = "https://www.goldapi.io/api/XAU/INR/";
    
    private static final double OUNCE_TO_GRAMS = 31.1035;

    // MCX ADJUSTMENT: International spot price + Import Duty (~15%) + GST (~3%)
    // Adjust this multiplier (e.g., 1.18 = +18%) to match today's MCX price exactly.
    private static final double INDIAN_MARKET_MULTIPLIER = 1.18;

    public GoldRateService(GoldRateRepository goldRateRepository, RestTemplate restTemplate) {
        this.goldRateRepository = goldRateRepository;
        this.restTemplate = restTemplate;
    }

    @PostConstruct
    public void fetchOnStartup() {
        log.info("Server started: triggering initial gold rate fetch");
        fetchAndSaveGoldRate();
    }

    // Runs once daily at 11:00 AM IST
    @Scheduled(cron = "0 0 11 * * ? ", zone = "Asia/Kolkata")
    public void fetchAndSaveGoldRate() {
        try {
            log.info("Fetching live gold rate from API");

           
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
                log.info("API success! Live spot price (1 ounce INR): ₹{}", livePricePerOunceInr);
                
                updateLocalGoldRate(livePricePerOunceInr);
            } else {
                log.warn("API responded, but 'price' data was missing");
            }

        } catch (NumberFormatException | RestClientException e) {
            log.error("API fetch error: {}", e.getMessage());
        }
    }

    private void updateLocalGoldRate(double currentPricePerOunceInr) {
        try {
            log.info("Saving live gold rate to database");
            Goldrates goldRate = new Goldrates();
            goldRate.setTimestamp(LocalDate.now());
            goldRate.setBase("INR");

            Rates rates = new Rates();

       
            double raw10gPriceInr = (currentPricePerOunceInr / OUNCE_TO_GRAMS) * 10;
            
          
            BigDecimal mcxAdjusted10gPrice = BigDecimal.valueOf(raw10gPriceInr * INDIAN_MARKET_MULTIPLIER);

            rates.setInr(mcxAdjusted10gPrice);
            

            goldRate.setRates(rates);

            goldRateRepository.save(goldRate);
            log.info("Saved successfully! Live 10g MCX-adjusted INR: ₹{}", mcxAdjusted10gPrice.setScale(0, java.math.RoundingMode.HALF_UP).longValue());

        } catch (Exception e) {
            log.error("Save error: {}", e.getMessage(), e);
        }
    }

    public Goldrates getLatestGoldRate() {
        return goldRateRepository.getLatestGoldRate();
 
 
    }  
    
    public void updateManualGoldRate(double per10gRate) {

    Goldrates goldRate = new Goldrates();
    
    goldRate.setTimestamp(LocalDate.now());
    goldRate.setBase("INR");

    Rates rates = new Rates();
    rates.setInr(BigDecimal.valueOf(per10gRate));  // store as-is, already per 10g
    goldRate.setRates(rates);

    goldRateRepository.save(goldRate);
    log.info("Manual gold rate updated: ₹{} per 10g", per10gRate);
}

    
}