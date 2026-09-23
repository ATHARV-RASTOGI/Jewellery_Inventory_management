package com.ems.inventory.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ems.Exception.Custom_Exception.InsufficientQuantity;
import com.ems.Exception.Custom_Exception.ItemNotFoundException;
import com.ems.inventory.model.Product;
import com.ems.inventory.repository.ProductRepository;

@ExtendWith(MockitoExtension.class)
public class StockServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private StockService stockService;

    @Test
    void testReserveAndDeduct_Success() {
        Product product = Product.builder()
                .sku("SKU-001")
                .stockQuantity(10)
                .totalweight(new BigDecimal("50.000"))
                .build();

        when(productRepository.findBySkuForUpdate("SKU-001")).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 3 pieces sold at 10.000g each = 30.000g sold, leaving 20.000g
        Product result = stockService.reserveAndDeduct("SKU-001", 3, new BigDecimal("10.000"));

        assertNotNull(result);
        assertEquals(7, result.getStockQuantity());
        assertEquals(new BigDecimal("20.000"), result.getTotalweight());
        verify(productRepository).save(product);
    }

    @Test
    void testReserveAndDeduct_Success_NullWeight() {
        Product product = Product.builder()
                .sku("SKU-001")
                .stockQuantity(10)
                .totalweight(new BigDecimal("50.000"))
                .build();

        when(productRepository.findBySkuForUpdate("SKU-001")).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Product result = stockService.reserveAndDeduct("SKU-001", 2, null);

        assertNotNull(result);
        assertEquals(8, result.getStockQuantity());
        assertEquals(new BigDecimal("50.000"), result.getTotalweight());
        verify(productRepository).save(product);
    }

    @Test
    void testReserveAndDeduct_InvalidQuantity() {
        assertThrows(IllegalArgumentException.class, () -> {
            stockService.reserveAndDeduct("SKU-001", 0, new BigDecimal("5.000"));
        });
        verify(productRepository, never()).findBySkuForUpdate(any());
    }

    @Test
    void testReserveAndDeduct_ItemNotFound() {
        when(productRepository.findBySkuForUpdate("SKU-UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(ItemNotFoundException.class, () -> {
            stockService.reserveAndDeduct("SKU-UNKNOWN", 1, null);
        });
    }

    @Test
    void testReserveAndDeduct_InsufficientStock() {
        Product product = Product.builder()
                .sku("SKU-001")
                .stockQuantity(2)
                .totalweight(new BigDecimal("10.000"))
                .build();

        when(productRepository.findBySkuForUpdate("SKU-001")).thenReturn(Optional.of(product));

        assertThrows(InsufficientQuantity.class, () -> {
            stockService.reserveAndDeduct("SKU-001", 5, null);
        });
        verify(productRepository, never()).save(any());
    }

    @Test
    void testReserveAndDeduct_InsufficientWeight() {
        Product product = Product.builder()
                .sku("SKU-001")
                .stockQuantity(10)
                .totalweight(new BigDecimal("10.000"))
                .build();

        when(productRepository.findBySkuForUpdate("SKU-001")).thenReturn(Optional.of(product));

        InsufficientQuantity ex = assertThrows(InsufficientQuantity.class, () -> {
            stockService.reserveAndDeduct("SKU-001", 1, new BigDecimal("15.000"));
        });
        assertEquals("Sold weight 15.000g exceeds stock weight 10.000g for SKU-001", ex.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    void testReserveAndDeduct_MultiQuantity_InsufficientWeight() {
        Product product = Product.builder()
                .sku("SKU-001")
                .stockQuantity(10)
                .totalweight(new BigDecimal("50.000"))
                .build();

        when(productRepository.findBySkuForUpdate("SKU-001")).thenReturn(Optional.of(product));

        // 3 pieces sold at 20.000g each = 60.000g, exceeding stock weight 50.000g
        InsufficientQuantity ex = assertThrows(InsufficientQuantity.class, () -> {
            stockService.reserveAndDeduct("SKU-001", 3, new BigDecimal("20.000"));
        });
        assertEquals("Sold weight 60.000g exceeds stock weight 50.000g for SKU-001", ex.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    void testReserveAndDeduct_NegativeWeight() {
        Product product = Product.builder()
                .sku("SKU-001")
                .stockQuantity(10)
                .totalweight(new BigDecimal("10.000"))
                .build();

        when(productRepository.findBySkuForUpdate("SKU-001")).thenReturn(Optional.of(product));

        assertThrows(IllegalArgumentException.class, () -> {
            stockService.reserveAndDeduct("SKU-001", 1, new BigDecimal("-1.000"));
        });
        verify(productRepository, never()).save(any());
    }

    @Test
    void testIncreaseStock_Success() {
        Product product = Product.builder()
                .sku("SKU-001")
                .stockQuantity(5)
                .totalweight(new BigDecimal("20.000"))
                .build();

        when(productRepository.findBySkuForUpdate("SKU-001")).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Product result = stockService.increaseStock("SKU-001", 4, new BigDecimal("12.500"));

        assertNotNull(result);
        assertEquals(9, result.getStockQuantity());
        assertEquals(new BigDecimal("32.500"), result.getTotalweight());
        verify(productRepository).save(product);
    }

    @Test
    void testIncreaseStock_InvalidQuantity() {
        assertThrows(IllegalArgumentException.class, () -> {
            stockService.increaseStock("SKU-001", 0, new BigDecimal("5.000"));
        });
        verify(productRepository, never()).findBySkuForUpdate(any());
    }

    @Test
    void testIncreaseStock_ItemNotFound() {
        when(productRepository.findBySkuForUpdate("SKU-UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(ItemNotFoundException.class, () -> {
            stockService.increaseStock("SKU-UNKNOWN", 2, null);
        });
    }
}
