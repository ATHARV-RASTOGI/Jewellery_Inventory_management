package com.ems.inventory.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

import com.ems.inventory.model.Rates;
import com.ems.inventory.model.Silver;
import com.ems.inventory.repository.SilverRateRepository;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SilverRateService {
     
    @Value("${goldapi.key}")
    private String apiKey;

    private final SilverRateRepository silverRateRepository;
    private final RestTemplate restTemplate;

    // We use XAG/INR directly to get the most accurate currency conversion
    private final static String SILVER_API_URL = "https://www.goldapi.io/api/XAG/INR/";
    

    private static final double OUNCE_TO_GRAMS = 31.1035;

    private static final double INDIAN_MARKET_MULTIPLIER = 1.18;

    SilverRateService(SilverRateRepository silverRateRepository, RestTemplate restTemplate) {
        this.silverRateRepository = silverRateRepository;
        this.restTemplate = restTemplate;
    }

    @PostConstruct
    public void fetchOnStartup(){
        log.info("Server started: triggering initial silver rate fetch");
        fetchAndSaveSilverRate();
    }
    
   @Scheduled(cron = "0 0 11 * * ? ", zone = "Asia/Kolkata")
    public void fetchAndSaveSilverRate(){
        try{
            log.info("Fetching live silver rate from API");
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-access-token", apiKey);
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
                log.info("API success! Live spot silver price (1 ounce INR): ₹{}", liveprice);
                
                updatesilverrate(liveprice);
            }
            else{
                log.warn("API responded, but silver 'price' data was missing");
            }
             } catch (NumberFormatException | RestClientException e) {
            log.error("API fetch error: {}", e.getMessage());
        }
    }
    private void updatesilverrate(double liveprice) {
        try {
            Silver silver= new Silver();
            silver.setTimestamp(LocalDateTime.now());
            silver.setBase("INR");

            Rates rate= new Rates();
            double raw10gPriceInr = ( liveprice/ OUNCE_TO_GRAMS) * 10;
            
          
            BigDecimal mcxAdjusted10gPrice = BigDecimal.valueOf(raw10gPriceInr * INDIAN_MARKET_MULTIPLIER);
            rate.setInr(mcxAdjusted10gPrice);
           
            silver.setRates(rate);
            silverRateRepository.save(silver);

        } catch (Exception e) {
            log.error("Save error: {}", e.getMessage(), e);
        }
    }
    public Silver getLatestSilverRate() {
        return silverRateRepository.findFirstByOrderByTimestampDesc().orElse(null);
    }   

    public void updateManualSilverRate(BigDecimal perGramRate) {
    Silver silver = new Silver();
    Rates rates= new Rates();
    silver.setTimestamp(LocalDateTime.now());
    silver.setBase("INR");


    rates.setInr(perGramRate);
    silver.setRates(rates);

    silverRateRepository.save(silver);
    log.info("Manual silver rate updated: ₹{} per 10 gram", perGramRate);
}
}