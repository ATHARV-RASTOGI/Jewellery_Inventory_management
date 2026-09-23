package com.ems.inventory.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.ems.inventory.model.Goldrates;

import com.ems.inventory.repository.GoldRateRepository;

@ExtendWith(MockitoExtension.class)
public class GoldRateServiceTest {


    @Mock
    private GoldRateRepository goldRateRepository;

    @Mock 
    private RestTemplate restTemplate;

    @InjectMocks 
    private GoldRateService goldRateService;

    @BeforeEach
    void setup(){
        goldRateService = new GoldRateService(goldRateRepository, restTemplate);
    }

    @Test
    void testFetchAndSaveGoldRate() {

        Map<String ,Object> fakebody = Map.of("price",74000);
        ResponseEntity<Map>fakeResponse = ResponseEntity.ok(fakebody);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class))).thenReturn(fakeResponse);
        goldRateService.fetchAndSaveGoldRate();
        ArgumentCaptor<Goldrates> captor = ArgumentCaptor.forClass(Goldrates.class);
        verify(goldRateRepository).save(captor.capture());
        assertEquals(new BigDecimal("28074.01"), captor.getValue().getRates().getInr());
    }

    @Test
    void testFetchAndSaveGoldRate_WhenRepositorySaveFails_PropagatesException() {
        Map<String, Object> fakebody = Map.of("price", 74000);
        ResponseEntity<Map> fakeResponse = ResponseEntity.ok(fakebody);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class))).thenReturn(fakeResponse);
        when(goldRateRepository.save(any(Goldrates.class))).thenThrow(new RuntimeException("Database error during gold rate save"));

        assertThrows(RuntimeException.class, () -> goldRateService.fetchAndSaveGoldRate());
    }

    @Test
    void testFetchOnStartup() {

        Map<String ,Object> fakebody = Map.of("price",74000);
        ResponseEntity<Map>fakeResponse = ResponseEntity.ok(fakebody);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class))).thenReturn(fakeResponse);
        goldRateService.fetchOnStartup();
        verify(goldRateRepository).save(any(Goldrates.class));
    }

    @Test
    void testGetLatestGoldRate() {

        Goldrates rate = new Goldrates();
        rate.setTimestamp(LocalDate.now());

        when(goldRateRepository.findFirstByOrderByTimestampDescIdDesc()).thenReturn(Optional.of(rate));
        
        Goldrates result = goldRateService.getLatestGoldRate();

        assertNotNull(result);
        assertEquals(rate.getTimestamp(), result.getTimestamp());
        
        verify(goldRateRepository).findFirstByOrderByTimestampDescIdDesc();
    }

    @Test
    void testGetLatestGoldRate_WhenNotFound_ReturnsNull() {
        when(goldRateRepository.findFirstByOrderByTimestampDescIdDesc()).thenReturn(Optional.empty());
        assertNull(goldRateService.getLatestGoldRate());
    }

    @Test
    void testUpdateManualGoldRate() {
        
        BigDecimal manualRate = new BigDecimal("85.00");

        goldRateService.updateManualGoldRate(manualRate);

        verify(goldRateRepository).save(any(Goldrates.class));
    }
}
