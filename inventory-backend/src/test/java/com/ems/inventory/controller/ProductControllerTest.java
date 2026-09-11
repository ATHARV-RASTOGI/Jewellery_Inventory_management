package com.ems.inventory.controller;

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
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ems.inventory.dto.BatchResponseDTO;
import com.ems.inventory.dto.ProductRequestDTO;
import com.ems.inventory.dto.ProductResponseDTO;
import com.ems.inventory.dto.StockInRequestDTO;
import com.ems.inventory.service.ProductService;
import com.ems.inventory.service.StockInService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(ProductController.class)
public class ProductControllerTest {

    @Autowired 
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService service;

    @MockitoBean
    private StockInService stockInService;

    @Autowired 
    private ObjectMapper objectMapper;

    private ProductResponseDTO response;

    private   ProductRequestDTO request;
    @BeforeEach 
    void setup(){

        response = new ProductResponseDTO();
        response.setId(1L);
        response.setName("Gold Ring");
        response.setSku("SKU-RING-01");
        response.setMaterial("Gold");

        request = new ProductRequestDTO();
        request.setName("Gold Ring");
        request.setSku("SKU-RING-01");
        request.setMaterial("Gold");
        request.setStockQuantity(10);
      
    }
    
    @Test
    void testAddProduct() throws Exception {
    

        when(service.saveProduct(any(ProductRequestDTO.class))).thenReturn(response);

        mockMvc.perform(post("/api/inventory/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Gold Ring"))
                .andExpect(jsonPath("$.sku").value("SKU-RING-01"));
    }

    @Test
    void testAddStock() throws Exception {
        StockInRequestDTO request = new StockInRequestDTO();
        request.setSku("KK-OO-99");
        request.setQuantityadded(2);    
        request.setWeightAdded(BigDecimal.valueOf(10.5));
        request.setBatchNumber("98880-0");

        BatchResponseDTO batch = new BatchResponseDTO();
        batch.setId(1L);
        batch.setBatchNumber("98880-0");
        batch.setQuantity(2);
        batch.setWeightAdded(BigDecimal.valueOf(10.5));

        when(stockInService.addStock(any(StockInRequestDTO.class))).thenReturn(batch);

        mockMvc.perform(post("/api/inventory/products/stock-in")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.batchNumber").value("98880-0"))
                .andExpect(jsonPath("$.quantity").value(2));
    }

    @Test
    void testGetProducts() throws Exception {

        ProductResponseDTO response = new ProductResponseDTO();
        response.setId(1L);
        response.setName("Gold Ring");
        response.setSku("SKU-RING-01");
        response.setMaterial("Gold");
        response.setStockQuantity(10);
        response.setSubCategory("Gents Ring");
        response.setPurity("22K");

        when(service.getFilterProducts("Gold", "Gents Ring", "22K", null)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/inventory/products")
                .param("mainCategory", "Gold")
                .param("subCategory", "Gents Ring")
                .param("purity", "22K"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Gold Ring"))
                .andExpect(jsonPath("$[0].sku").value("SKU-RING-01"));
    }

    @Test
    void testUpdateProduct() throws Exception {

        when(service.updateProduct(eq(1L), any(ProductRequestDTO.class))).thenReturn(response);

        mockMvc.perform(put("/api/inventory/products/{id}", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Gold Ring"));
    }

    @Test
    void testDeleteProduct() throws Exception {
        doNothing().when(service).deleteProduct(1L);

        mockMvc.perform(delete("/api/inventory/products/{id}", 1L))
                .andExpect(status().isNoContent()); // 204 No Content
    }
}
