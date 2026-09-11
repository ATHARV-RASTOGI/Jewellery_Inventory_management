package com.ems.inventory.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ems.inventory.model.Goldrates;
import com.ems.inventory.model.Rates;
import com.ems.inventory.model.Silver;
import com.ems.inventory.service.GoldRateService;
import com.ems.inventory.service.ProductService;
import com.ems.inventory.service.SilverRateService;
import com.ems.loan.service.LoanService;

@WebMvcTest(DashboardController.class)
public class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SilverRateService silverRateService;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private LoanService loanService;

    @MockitoBean
    private GoldRateService goldRateService;

    @Test
    void testGetDashboardStats_Success() throws Exception {
        Rates goldRates = new Rates();
        goldRates.setInr(new BigDecimal("72000.00"));

        Goldrates gold = Goldrates.builder()
                .id(1L)
                .base("INR")
                .timestamp(LocalDate.now())
                .rates(goldRates)
                .build();

        Rates silverRates = new Rates();
        silverRates.setInr(new BigDecimal("900.00"));

        Silver silver = Silver.builder()
                .id(1L)
                .base("INR")
                .timestamp(LocalDate.now())
                .rates(silverRates)
                .build();

        when(goldRateService.getLatestGoldRate()).thenReturn(gold);
        when(silverRateService.getLatestSilverRate()).thenReturn(silver);
        when(productService.getTotalItems()).thenReturn(150);
        when(loanService.countActiveLoans()).thenReturn(12L);
        when(loanService.getTotalLoanAmount()).thenReturn(new BigDecimal("500000.00"));
        when(productService.getTotalvalue()).thenReturn(new BigDecimal("1200000.00"));
        when(productService.getCountOfItemsWithLowStock()).thenReturn(4);

        mockMvc.perform(get("/api/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goldRatePer10Gram").value(72000))
                .andExpect(jsonPath("$.goldRatePerGram").value(7200))
                .andExpect(jsonPath("$.silverRatePer10Gram").value(900))
                .andExpect(jsonPath("$.silverRatePerGram").value(90))
                .andExpect(jsonPath("$.totalItemsInStock").value(150))
                .andExpect(jsonPath("$.activeLoansCount").value(12))
                .andExpect(jsonPath("$.totalOutstandingAmount").value(500000.00))
                .andExpect(jsonPath("$.totalInventoryValue").value(1200000.00))
                .andExpect(jsonPath("$.lowStockItemsCount").value(4))
                .andExpect(jsonPath("$.inventoryChangePercent").value(0.0));
    }

    @Test
    void testGetDashboardStats_NullRates_DefaultsToZero() throws Exception {
        when(goldRateService.getLatestGoldRate()).thenReturn(null);
        when(silverRateService.getLatestSilverRate()).thenReturn(null);
        when(productService.getTotalItems()).thenReturn(0);
        when(loanService.countActiveLoans()).thenReturn(0L);
        when(loanService.getTotalLoanAmount()).thenReturn(BigDecimal.ZERO);
        when(productService.getTotalvalue()).thenReturn(BigDecimal.ZERO);
        when(productService.getCountOfItemsWithLowStock()).thenReturn(0);

        mockMvc.perform(get("/api/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goldRatePer10Gram").value(0))
                .andExpect(jsonPath("$.goldRatePerGram").value(0))
                .andExpect(jsonPath("$.silverRatePer10Gram").value(0))
                .andExpect(jsonPath("$.silverRatePerGram").value(0))
                .andExpect(jsonPath("$.totalItemsInStock").value(0))
                .andExpect(jsonPath("$.activeLoansCount").value(0));
    }
}
