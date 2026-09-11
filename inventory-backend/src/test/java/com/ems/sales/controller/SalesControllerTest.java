package com.ems.sales.controller;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ems.sales.dto.SalesRequestDTO;
import com.ems.sales.dto.SalesResponseDTO;
import com.ems.sales.dto.SalesitemRequestDTO;
import com.ems.sales.dto.SalesitemResponseDTO;
import com.ems.sales.service.SalesService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest (SalesController.class)
public class SalesControllerTest {

    @Autowired 
    private MockMvc mockMvc;

    @MockitoBean 
    private SalesService salesService;

    @Autowired 
    private ObjectMapper objectMapper;


    private SalesResponseDTO responseDto;

    @BeforeEach 
    void setup(){
        
      responseDto = SalesResponseDTO.builder()
            .id(1L)
            .customerName("Ramesh")
            .grandTotal(new BigDecimal("25000.00"))
            .build();
    }
     
    @Test
    void testCreateSales() throws Exception{

        SalesitemRequestDTO item = new SalesitemRequestDTO();
        item.setSku("SKU-P-OO-01");
        item.setQuantity(9);

        SalesRequestDTO request = new SalesRequestDTO();
        request.setCustomerName("Ramesh");
        request.setCustomerPhoneNo("1234567890");
        request.setCustomerAddress("123 Main St");
        request.setItems(List.of(item));

        when(salesService.createsales(any(SalesRequestDTO.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/sales")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(request))) 
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.customerName").value("Ramesh"))
        .andExpect(jsonPath("$.grandTotal").value(25000.00));
        
    }

    @Test
    void testGetAllSales()throws Exception {

        when(salesService.getAllSales()).thenReturn(List.of(responseDto));

         mockMvc.perform(get("/api/sales"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.size()").value(1))
            .andExpect(jsonPath("$[0].customerName").value("Ramesh"))
            .andExpect(jsonPath("$[0].grandTotal").value(25000.00));

    }

    @Test
    void testGetRecentSales() throws Exception{

        when(salesService.getRecentSales(10)).thenReturn(List.of(responseDto));

        mockMvc.perform(get("/api/sales/analytics/recent"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.size()").value(1))
        .andExpect(jsonPath("$[0].customerName").value("Ramesh"))
        .andExpect(jsonPath("$[0].grandTotal").value(25000.00));
    }

    @Test
    void testGetRevenueOverview() throws Exception{

            Map<String, Object> point = Map.of(
        "month", "Jan",
        "revenue", 25000);

        when(salesService.getMonthlyRevenue()).thenReturn(List.of(point));

        mockMvc.perform(get("/api/sales/analytics/revenue-overview"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.size()").value(1))
        .andExpect(jsonPath("$[0].month").value("Jan"))
        .andExpect(jsonPath("$[0].revenue").value(25000));
    }

    @Test
    void testGetSalesByMaterial() throws Exception{
        Map<String, Object> gold = Map.of(
        "material", "Gold",
        "value", 25000
    );
    Map<String, Object> silver = Map.of(
        "material", "Silver",
        "value", 20000
    );


        when(salesService.getSalesByMaterial()).thenReturn(List.of(gold,silver));


        mockMvc.perform(get("/api/sales/analytics/by-material"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.size()").value(2))
            
            .andExpect(jsonPath("$[0].material").value("Gold"))
            .andExpect(jsonPath("$[0].value").value(25000))
           
            .andExpect(jsonPath("$[1].material").value("Silver"))
            .andExpect(jsonPath("$[1].value").value(20000));
    }

    @Test
    void testGetSalesItem() throws Exception{

        Long id = 9L;

        SalesitemResponseDTO item = new SalesitemResponseDTO();
        item.setId(id);
        item.setSku("KK-00-8239");
        
        when(salesService.getItemsForSale(id)).thenReturn(List.of(item));

        mockMvc.perform(get("/api/sales/{id}/items", id))
         .andExpect(status().isOk())
         .andExpect(jsonPath("$.size()").value(1))
         .andExpect(jsonPath("$[0].sku").value("KK-00-8239"));
    }

    @Test
    void testGetWeeklySales() throws Exception {

        Map<String,Object> res = Map.of(
            "day" , "Mon",
            "sales" , 150000
        );

        when(salesService.getWeeklySales()).thenReturn(List.of(res));

        mockMvc.perform(get("/api/sales/analytics/weekly"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.size()").value(1))
        .andExpect(jsonPath("$[0].day").value("Mon"))
        .andExpect(jsonPath("$[0].sales").value(150000));

    }
}
