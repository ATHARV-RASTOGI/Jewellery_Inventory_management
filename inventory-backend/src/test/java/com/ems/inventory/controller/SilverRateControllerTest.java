package com.ems.inventory.controller;

import static org.mockito.Mockito.doNothing;
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
import com.ems.inventory.model.Rates;
import com.ems.inventory.model.Silver;
import com.ems.inventory.service.SilverRateService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(SilverRateController.class)
@Import(GlobalExceptionClass.class)
public class SilverRateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SilverRateService silverRateService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetLatestSilverRate_Success() throws Exception {
        Rates rates = new Rates();
        rates.setInr(new BigDecimal("950.00"));

        Silver silver = Silver.builder()
                .id(1L)
                .base("INR")
                .timestamp(LocalDate.now())
                .rates(rates)
                .build();

        when(silverRateService.getLatestSilverRate()).thenReturn(silver);

        mockMvc.perform(get("/api/silver-rates/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rate").value(950.00));
    }

    @Test
    void testGetLatestSilverRate_NotFound() throws Exception {
        when(silverRateService.getLatestSilverRate()).thenReturn(null);

        mockMvc.perform(get("/api/silver-rates/latest"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateSilverRate_Success() throws Exception {
        RateUpdateRequestDTO request = new RateUpdateRequestDTO();
        request.setRate(new BigDecimal("960.00"));

        doNothing().when(silverRateService).updateManualSilverRate(new BigDecimal("960.00"));

        mockMvc.perform(post("/api/silver-rates/update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Silver rate updated successfully"));
    }

    @Test
    void testUpdateSilverRate_MissingRate_ReturnsBadRequest() throws Exception {
        RateUpdateRequestDTO request = new RateUpdateRequestDTO();
        request.setRate(null);

        mockMvc.perform(post("/api/silver-rates/update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("rate is required"));
    }
}
