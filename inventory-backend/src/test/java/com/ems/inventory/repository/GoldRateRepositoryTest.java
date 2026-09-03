package com.ems.inventory.repository;


import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import org.apache.poi.ss.formula.functions.Rate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.cglib.core.Local;

import com.ems.inventory.model.Goldrates;
import com.ems.inventory.model.Rates;

@DataJpaTest
public class GoldRateRepositoryTest {


    @Autowired
    private GoldRateRepository goldRateRepository;
    
    private Rates createRate(BigDecimal inr){
        Rates rates = new Rates();
        rates.setInr(inr);
        return rates;
    }


    private Goldrates createGoldRate(LocalDate timestamp , BigDecimal inr){
            return Goldrates.builder()
            .timestamp(timestamp)
            .rates(createRate(inr))
            .base("INR")
            .build();

    }


    @Test
    void testFindFirstByOrderByTimestampDesc() {

        goldRateRepository.save(createGoldRate(LocalDate.now().minusDays(2),new BigDecimal("50989")));

        Goldrates newGoldRate= goldRateRepository.save(createGoldRate(LocalDate.now(),new BigDecimal("51989")));

       Optional<Goldrates> res = goldRateRepository.findFirstByOrderByTimestampDesc();

       assertTrue(res.isPresent());
       assertEquals(newGoldRate.getId(),res.get().getId());
       assertEquals(0,new BigDecimal("51989").compareTo(newGoldRate.getRates().getInr()));
       assertEquals(LocalDate.now(), res.get().getTimestamp());
    
    }
}
