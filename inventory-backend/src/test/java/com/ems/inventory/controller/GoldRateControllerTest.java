package com.ems.inventory.controller;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ems.Exception.Controller.GlobalExceptionClass;
import com.ems.inventory.dto.RateUpdateRequestDTO;
import com.ems.inventory.model.Goldrates;
import com.ems.inventory.model.Rates;
import com.ems.inventory.service.GoldRateService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(GoldRateController.class)
@Import(GlobalExceptionClass.class)
public class GoldRateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GoldRateService goldRateService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testFetchNow() throws Exception {
        doNothing().when(goldRateService).fetchOnStartupAsync();

        mockMvc.perform(get("/api/gold-rate/fetch-now"))
                .andExpect(status().isOk())
                .andExpect(content().string("Gold rate fetch initiated in the background."));

        verify(goldRateService).fetchOnStartupAsync();
    }

    @Test
    void testGetLatestGoldRate_Success() throws Exception {
        Rates rates = new Rates();
        rates.setInr(new BigDecimal("75000.00"));

        Goldrates gold = Goldrates.builder()
                .id(1L)
                .base("INR")
                .timestamp(LocalDate.now())
                .rates(rates)
                .build();

        when(goldRateService.getLatestGoldRate()).thenReturn(gold);

        mockMvc.perform(get("/api/gold-rate/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.rates.INR").value(75000.00));
    }

    @Test
    void testGetLatestGoldRate_NotFound() throws Exception {
        when(goldRateService.getLatestGoldRate()).thenReturn(null);

        mockMvc.perform(get("/api/gold-rate/latest"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateGoldRate_Success() throws Exception {
        RateUpdateRequestDTO request = new RateUpdateRequestDTO();
        request.setRate(new BigDecimal("76000.00"));

        doNothing().when(goldRateService).updateManualGoldRate(76000.0);

        mockMvc.perform(post("/api/gold-rate/update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Gold rate updated successfully"));

        verify(goldRateService).updateManualGoldRate(76000.0);
    }

    @Test
    void testUpdateGoldRate_MissingRate_ReturnsBadRequest() throws Exception {
        RateUpdateRequestDTO request = new RateUpdateRequestDTO();
        request.setRate(null);

        mockMvc.perform(post("/api/gold-rate/update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("rate is required"));
    }
}
