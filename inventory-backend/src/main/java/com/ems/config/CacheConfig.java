package com.ems.config;

import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.transaction.TransactionAwareCacheManagerProxy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

@Configuration
public class CacheConfig {


    public static final String CACHE_GOLD_RATE="gold_rates";
    public static final String CACHE_SILVER_RATES = "silver_rates";
    public static final String CACHE_PRODUCTS = "products";
    public static final String CACHE_LOANS = "loans";
    public static final String CACHE_SALES_ANALYTICS = "sales_analytics";
    public static final String CACHE_INVENTORY_METRICS = "inventory_metrics";

    @Bean
    public CacheManager cacheManager(){
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            CACHE_GOLD_RATE,
            CACHE_SILVER_RATES,
            CACHE_PRODUCTS,
            CACHE_LOANS,
            CACHE_SALES_ANALYTICS,
            CACHE_INVENTORY_METRICS
        );

        cacheManager.setCaffeine(Caffeine.newBuilder()
            .initialCapacity(100)
            .maximumSize(5000)
            .expireAfterWrite(4 , TimeUnit.HOURS)
            .recordStats()
        );

        return new TransactionAwareCacheManagerProxy(cacheManager);
    }

}
