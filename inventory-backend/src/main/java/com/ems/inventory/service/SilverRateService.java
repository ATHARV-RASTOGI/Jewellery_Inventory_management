package com.ems.inventory.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.ems.inventory.model.Rates;
import com.ems.inventory.model.Silver;
import com.ems.inventory.repository.SilverRateRepository;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
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
    

    private static final BigDecimal OUNCE_TO_GRAMS = new BigDecimal("31.1035");

    private static final BigDecimal INDIAN_MARKET_MULTIPLIER = new BigDecimal("1.18");

    SilverRateService(SilverRateRepository silverRateRepository, RestTemplate restTemplate) {
        this.silverRateRepository = silverRateRepository;
        this.restTemplate = restTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Async
    @Order(2)
    public void fetchOnStartup(){
        log.info("Server started: triggering initial silver rate fetch");
        fetchAndSaveSilverRate();
    }

    @CacheEvict(value = {"silver_rates", "inventory_metrics", "sales_analytics"}, allEntries = true)
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
                BigDecimal liveprice = new BigDecimal(response.getBody().get("price").toString());
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
    @Transactional
    public void updatesilverrate(BigDecimal liveprice) {
        Silver silver = new Silver();
        silver.setTimestamp(LocalDate.now());
        silver.setBase("INR");

        Rates rate = new Rates();
        BigDecimal mcxAdjusted10gPrice = liveprice
                .multiply(BigDecimal.TEN)
                .multiply(INDIAN_MARKET_MULTIPLIER)
                .divide(OUNCE_TO_GRAMS, 2, RoundingMode.HALF_UP);
        rate.setInr(mcxAdjusted10gPrice);
       
        silver.setRates(rate);
        silverRateRepository.save(silver);
    }

    @Cacheable(value = "silver_rates", key = "'latest'", unless = "#result == null")
    public Silver getLatestSilverRate() {
        return silverRateRepository.findFirstByOrderByTimestampDescIdDesc().orElse(null);
    }   

    @CacheEvict(value = {"silver_rates", "inventory_metrics", "sales_analytics"},allEntries = true)
    @Transactional
    public void updateManualSilverRate(BigDecimal perGramRate) {
    Silver silver = new Silver();
    Rates rates= new Rates();
    silver.setTimestamp(LocalDate.now());
    silver.setBase("INR");


    rates.setInr(perGramRate);
    silver.setRates(rates);

    silverRateRepository.save(silver);
    log.info("Manual silver rate updated: ₹{} per 10 gram", perGramRate);
}
}