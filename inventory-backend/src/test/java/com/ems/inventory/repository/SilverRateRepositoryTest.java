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
    void testFindFirstByOrderByTimestampDescIdDesc() {

        silverRateRepository.save(createGoldRate(LocalDate.now().minusDays(2), new BigDecimal("50989")));

        Silver newGoldRate = silverRateRepository.save(createGoldRate(LocalDate.now(), new BigDecimal("51989")));

        Optional<Silver> res = silverRateRepository.findFirstByOrderByTimestampDescIdDesc();

        assertTrue(res.isPresent());
        assertEquals(newGoldRate.getId(), res.get().getId());
        assertEquals(0, new BigDecimal("51989").compareTo(newGoldRate.getRates().getInr()));
        assertEquals(LocalDate.now(), res.get().getTimestamp());
    }

    @Test
    void testFindFirstByOrderByTimestampDescIdDesc_SameDayTieBreaker() {
        // First entry today (e.g., scheduled fetch)
        silverRateRepository.save(createGoldRate(LocalDate.now(), new BigDecimal("900")));

        // Second entry today (e.g., manual correction later in the day)
        Silver correctedRate = silverRateRepository.save(createGoldRate(LocalDate.now(), new BigDecimal("950")));

        Optional<Silver> res = silverRateRepository.findFirstByOrderByTimestampDescIdDesc();

        assertTrue(res.isPresent());
        assertEquals(correctedRate.getId(), res.get().getId());
        assertEquals(0, new BigDecimal("950").compareTo(res.get().getRates().getInr()));
    }
}
