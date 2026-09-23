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

import com.ems.inventory.model.Goldrates;
import com.ems.inventory.model.Rates;
import com.ems.inventory.repository.GoldRateRepository;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
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
    
    private static final BigDecimal OUNCE_TO_GRAMS = new BigDecimal("31.1035");

    // MCX ADJUSTMENT: International spot price + Import Duty (~15%) + GST (~3%)
    // Adjust this multiplier (e.g., 1.18 = +18%) to match today's MCX price exactly.
    private static final BigDecimal INDIAN_MARKET_MULTIPLIER = new BigDecimal("1.18");

    public GoldRateService(GoldRateRepository goldRateRepository, RestTemplate restTemplate) {
        this.goldRateRepository = goldRateRepository;
        this.restTemplate = restTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Async
    @Order(1)
    public void fetchOnStartup() {
        log.info("Server started: triggering initial gold rate fetch");
        fetchAndSaveGoldRate();
    }


    // Runs once daily at 11:00 AM IST
    @CacheEvict(value = {"gold_rates", "inventory_metrics", "sales_analytics"}, allEntries = true)
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
                
                BigDecimal livePricePerOunceInr = new BigDecimal(response.getBody().get("price").toString());
                log.info("API success! Live spot price (1 ounce INR): ₹{}", livePricePerOunceInr);
                
                updateLocalGoldRate(livePricePerOunceInr);
            } else {
                log.warn("API responded, but 'price' data was missing");
            }

        } catch (NumberFormatException | RestClientException e) {
            log.error("API fetch error: {}", e.getMessage());
        }
    }

    @Cacheable(value = "gold_rates", key = "'latest'", unless = "#result == null")
    public Goldrates getLatestGoldRate() {
        return goldRateRepository.findFirstByOrderByTimestampDescIdDesc().orElse(null);
    }  

    @Transactional
    public void updateLocalGoldRate(BigDecimal currentPricePerOunceInr) {
        log.info("Saving live gold rate to database");
        Goldrates goldRate = new Goldrates();
        goldRate.setTimestamp(LocalDate.now());
        goldRate.setBase("INR");

        Rates rates = new Rates();

        BigDecimal mcxAdjusted10gPrice = currentPricePerOunceInr
                .multiply(BigDecimal.TEN)
                .multiply(INDIAN_MARKET_MULTIPLIER)
                .divide(OUNCE_TO_GRAMS, 2, RoundingMode.HALF_UP);

        rates.setInr(mcxAdjusted10gPrice);

        goldRate.setRates(rates);

        goldRateRepository.save(goldRate);
        log.info("Saved successfully! Live 10g MCX-adjusted INR: ₹{}", mcxAdjusted10gPrice.setScale(0, RoundingMode.HALF_UP).longValue());
    }

    
    @CacheEvict(value = {"gold_rates", "inventory_metrics", "sales_analytics"}, allEntries = true)
    @Transactional
    public void updateManualGoldRate(BigDecimal per10gRate) {

    Goldrates goldRate = new Goldrates();
    
    goldRate.setTimestamp(LocalDate.now());
    goldRate.setBase("INR");

    Rates rates = new Rates();
    rates.setInr(per10gRate);  // store as-is, already per 10g
    goldRate.setRates(rates);

    goldRateRepository.save(goldRate);
    log.info("Manual gold rate updated: ₹{} per 10g", per10gRate);
}

    
}