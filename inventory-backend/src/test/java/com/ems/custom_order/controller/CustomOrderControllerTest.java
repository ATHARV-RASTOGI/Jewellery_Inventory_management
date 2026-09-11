package com.ems.custom_order.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ems.Exception.Controller.GlobalExceptionClass;
import com.ems.Exception.Custom_Exception.CustomOrderNotFoundException;
import com.ems.custom_order.dto.CustomOrderRequestDTO;
import com.ems.custom_order.dto.CustomOrderResponseDTO;
import com.ems.custom_order.model.OrderStatus;
import com.ems.custom_order.service.CustomOrderService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(CustomOrderController.class)
@Import(GlobalExceptionClass.class)
public class CustomOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CustomOrderService customOrderService;

    @Autowired
    private ObjectMapper objectMapper;

    private CustomOrderRequestDTO validRequest;
    private CustomOrderResponseDTO sampleResponse;

    @BeforeEach
    void setUp() {
        validRequest = CustomOrderRequestDTO.builder()
                .customerName("Rahul Verma")
                .customerPhone("9876543210")
                .customerAddress("Lucknow")
                .itemName("Diamond Ring")
                .materialType("Gold")
                .advanceAmount(new BigDecimal("10000.00"))
                .totalAmount(new BigDecimal("50000.00"))
                .status(OrderStatus.PENDING)
                .orderDate(LocalDate.now())
                .pickupDate(LocalDate.now().plusDays(7))
                .build();

        sampleResponse = CustomOrderResponseDTO.builder()
                .orderId(1L)
                .customerName("Rahul Verma")
                .customerPhone("9876543210")
                .itemName("Diamond Ring")
                .advanceAmount(new BigDecimal("10000.00"))
                .totalAmount(new BigDecimal("50000.00"))
                .status(OrderStatus.PENDING)
                .build();
    }

    @Test
    void testCreateNewOrder_Success() throws Exception {
        when(customOrderService.saveCustomOrder(any(CustomOrderRequestDTO.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/custom-order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(1))
                .andExpect(jsonPath("$.customerName").value("Rahul Verma"))
                .andExpect(jsonPath("$.itemName").value("Diamond Ring"));
    }

    @Test
    void testCreateNewOrder_ValidationFailure_BlankCustomerName() throws Exception {
        validRequest.setCustomerName(""); 
        
        mockMvc.perform(post("/api/custom-order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateNewOrder_ValidationFailure_InvalidPhone() throws Exception {
        validRequest.setCustomerPhone("123"); 
        mockMvc.perform(post("/api/custom-order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetAllOrders() throws Exception {
        when(customOrderService.getAllCustomOrder()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/custom-order"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].orderId").value(1))
                .andExpect(jsonPath("$[0].customerName").value("Rahul Verma"));
    }

    @Test
    void testGetById_Success() throws Exception {
        when(customOrderService.getCustomOrderById(1L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/custom-order/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(1))
                .andExpect(jsonPath("$.customerName").value("Rahul Verma"));
    }

    @Test
    void testGetById_NotFound() throws Exception {
        when(customOrderService.getCustomOrderById(99L)).thenThrow(new CustomOrderNotFoundException(99L));

        mockMvc.perform(get("/api/custom-order/{id}", 99L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.details").value("Custom order not found"));
    }

    @Test
    void testUpdateOrder_Success() throws Exception {
        when(customOrderService.updateCustomOrder(eq(1L), any(CustomOrderRequestDTO.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/custom-order/{id}", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(1))
                .andExpect(jsonPath("$.customerName").value("Rahul Verma"));
    }

    @Test
    void testDeleteOrder_Success() throws Exception {
        doNothing().when(customOrderService).deleteCustomOrder(1L);

        mockMvc.perform(delete("/api/custom-order/{id}", 1L))
                .andExpect(status().isNoContent()); 
    }
}
