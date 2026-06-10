package com.ems.inventory.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.ems.inventory.model.Rates;
import com.ems.inventory.model.Goldrates;
import com.ems.inventory.repository.GoldRateRepository;

import jakarta.annotation.PostConstruct;

@Service
public class SilverRateService {

    @Autowired
    private GoldRateRepository goldRateRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    // We use XAU/INR directly to get the most accurate currency conversion
    private final static String SILVER_API_URL = "https://www.goldapi.io/api/XAG/INR/";
    
    // YOUR LIVE API KEY
    private final static String API_KEY = "goldapi-2dfb4fc06b25112540f024a99aa7cec7-io";

    private static final double OUNCE_TO_GRAMS = 31.1035;

    private static final double INDIAN_MARKET_MULTIPLIER = 1.15;

    @PostConstruct
    public void fetchOnStartup(){
        System.out.println("=== SERVER STARTED: TRIGGERING INITIAL GOLD RATE FETCH ===");
        fetchAndSaveSilverRate();
    }
    
    @Scheduled(cron = "0 0 * * * ?")
    public void fetchAndSaveSilverRate(){
        
    }

}