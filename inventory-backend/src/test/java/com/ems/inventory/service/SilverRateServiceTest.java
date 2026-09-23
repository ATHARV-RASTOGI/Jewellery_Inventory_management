package com.ems.inventory.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.ems.inventory.model.Silver;
import com.ems.inventory.repository.SilverRateRepository;

@ExtendWith(MockitoExtension.class)
public class SilverRateServiceTest {

    @Mock
    private SilverRateRepository silverRateRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private SilverRateService silverRateService;
     

    @BeforeEach
    void setUp() {
        silverRateService = new SilverRateService(silverRateRepository, restTemplate);

      
    }

    @Test
    void testFetchAndSaveSilverRate() {

        Map<String , Object> fakebody = Map.of("price", 2500.0);

        ResponseEntity<Map> fakeresponse = ResponseEntity.ok(fakebody);

        when(restTemplate.exchange(anyString(),eq(HttpMethod.GET),any(HttpEntity.class),eq(Map.class))).thenReturn(fakeresponse);

        silverRateService.fetchAndSaveSilverRate();
        ArgumentCaptor<Silver> captor = ArgumentCaptor.forClass(Silver.class);
        verify(silverRateRepository).save(captor.capture());
        assertEquals(new BigDecimal("948.45"), captor.getValue().getRates().getInr());

        
        
    }

    @Test
    void testFetchAndSaveSilverRate_WhenRepositorySaveFails_PropagatesException() {
        Map<String, Object> fakebody = Map.of("price", 2500.0);
        ResponseEntity<Map> fakeresponse = ResponseEntity.ok(fakebody);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class))).thenReturn(fakeresponse);
        when(silverRateRepository.save(any(Silver.class))).thenThrow(new RuntimeException("Database error during silver rate save"));

        assertThrows(RuntimeException.class, () -> silverRateService.fetchAndSaveSilverRate());
    }

    @Test
    void testFetchOnStartup() {

        Map<String , Object> fakebody = Map.of("price", 2500.0);

        ResponseEntity<Map> fakeresponse = ResponseEntity.ok(fakebody);

        when(restTemplate.exchange(anyString(),eq(HttpMethod.GET),any(HttpEntity.class),eq(Map.class))).thenReturn(fakeresponse);

        silverRateService.fetchAndSaveSilverRate();

        verify(silverRateRepository).save(any(Silver.class));

    }

    @Test
    void testGetLatestSilverRate() {
        Silver rate = new Silver();
        rate.setTimestamp(LocalDate.now());

        when(silverRateRepository.findFirstByOrderByTimestampDescIdDesc()).thenReturn(Optional.of(rate));

        Silver result = silverRateService.getLatestSilverRate();

        assertNotNull(result);
        assertEquals(rate.getTimestamp(), result.getTimestamp());

        verify(silverRateRepository).findFirstByOrderByTimestampDescIdDesc();
    }

    @Test
    void testGetLatestSilverRate_WhenNotFound_ReturnsNull() {
        when(silverRateRepository.findFirstByOrderByTimestampDescIdDesc()).thenReturn(Optional.empty());
        assertNull(silverRateService.getLatestSilverRate());
    }

    @Test
    void testUpdateManualSilverRate() {

        BigDecimal update = new BigDecimal("9000.00");

        silverRateService.updateManualSilverRate(update);

        verify(silverRateRepository).save(any(Silver.class));
    }
}
