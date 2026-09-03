package com.ems.inventory.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.ems.inventory.model.Rates;
import com.ems.inventory.model.Silver;

@DataJpaTest
public class SilverRateRepositoryTest {

    @Autowired
    private SilverRateRepository silverRateRepository;
    
    private Rates createRate(BigDecimal inr){
        Rates rates = new Rates();
        rates.setInr(inr);
        return rates;
    }


    private Silver createGoldRate(LocalDate timestamp , BigDecimal inr){
            return Silver.builder()
            .timestamp(timestamp)
            .rates(createRate(inr))
            .base("INR")
            .build();

    }


    @Test
    void testFindFirstByOrderByTimestampDesc() {

        silverRateRepository.save(createGoldRate(LocalDate.now().minusDays(2),new BigDecimal("50989")));

        Silver newGoldRate= silverRateRepository.save(createGoldRate(LocalDate.now(),new BigDecimal("51989")));

       Optional<Silver> res = silverRateRepository.findFirstByOrderByTimestampDesc();

       assertTrue(res.isPresent());
       assertEquals(newGoldRate.getId(),res.get().getId());
       assertEquals(0,new BigDecimal("51989").compareTo(newGoldRate.getRates().getInr()));
       assertEquals(LocalDate.now(), res.get().getTimestamp());
    
    }
}
