package com.ems.purchase.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ems.gst.model.HsnMaster;
import com.ems.gst.repository.HsnMasterRepository;
import com.ems.inventory.model.Product;
import com.ems.inventory.service.StockService;
import com.ems.purchase.dto.PurchaseItemRequestDTO;
import com.ems.purchase.dto.PurchaseItemResponseDTO;
import com.ems.purchase.dto.PurchaseRequestDTO;
import com.ems.purchase.dto.PurchaseResponseDTO;
import com.ems.purchase.model.Purchase;
import com.ems.purchase.model.PurchaseItem;
import com.ems.purchase.repository.PurchaseItemRepository;
import com.ems.purchase.repository.PurchaseRepository;

@ExtendWith(MockitoExtension.class)
public class PurchaseServiceTest {

    @Mock
    private PurchaseRepository purchaseRepository;

    @Mock
    private PurchaseItemRepository purchaseItemRepository;

    @Mock
    private StockService stockService;

    @Mock
    private HsnMasterRepository hsnMasterRepository;

    @InjectMocks
    private PurchaseService purchaseService;

    @Test
    void testCreatePurchase_Success() {
        // Arrange
        Product product = Product.builder()
                .id(1L)
                .sku("SKU-GOLD-RING-01")
                .name("Gold Ring 22K")
                .material("Gold")
                .purity("22K")
                .stockQuantity(10)
                .totalweight(new BigDecimal("50.000"))
                .build();

        when(stockService.increaseStock("SKU-GOLD-RING-01", 5, new BigDecimal("25.000"))).thenReturn(product);
        when(hsnMasterRepository.findByMaterialKeyIgnoreCase("Gold")).thenReturn(Optional.of(
                HsnMaster.builder().materialKey("Gold").hsnCode("7113").build()
        ));

        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> {
            Purchase p = invocation.getArgument(0);
            if (p.getId() == null) {
                p.setId(101L);
            }
            if (p.getItems() == null) {
                p.setItems(new ArrayList<>());
            }
            return p;
        });

        when(purchaseItemRepository.save(any(PurchaseItem.class))).thenAnswer(invocation -> {
            PurchaseItem pi = invocation.getArgument(0);
            pi.setId(201L);
            return pi;
        });

        PurchaseItemRequestDTO itemReq = new PurchaseItemRequestDTO();
        itemReq.setSku("SKU-GOLD-RING-01");
        itemReq.setQuantity(5);
        itemReq.setWeight(new BigDecimal("25.000"));
        itemReq.setCostPerGram(new BigDecimal("6000.00"));

        PurchaseRequestDTO request = new PurchaseRequestDTO();
        request.setSupplierName("ABC Bullion");
        request.setSupplierPhone("9876543210");
        request.setSupplierGstin("07AAAAA0000A1Z5");
        request.setSupplierInvoiceNo("INV-SUP-999");
        request.setPurchaseDate(LocalDate.of(2026, 9, 14));
        request.setItems(List.of(itemReq));

        // Act
        PurchaseResponseDTO response = purchaseService.createPurchase(request);

        // Assert
        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals("ABC Bullion", response.getSupplierName());
        assertEquals("INV-SUP-999", response.getSupplierInvoiceNo());
        assertEquals(1, response.getItemCount());

        verify(stockService).increaseStock("SKU-GOLD-RING-01", 5, new BigDecimal("25.000"));
    }

    @Test
    void testCreatePurchase_MissingSupplier_ThrowsException() {
        PurchaseRequestDTO request = new PurchaseRequestDTO();
        request.setSupplierInvoiceNo("INV-001");
        request.setItems(List.of(new PurchaseItemRequestDTO()));

        assertThrows(IllegalArgumentException.class, () -> purchaseService.createPurchase(request));
    }

    @Test
    void testCreatePurchase_EmptyItems_ThrowsException() {
        PurchaseRequestDTO request = new PurchaseRequestDTO();
        request.setSupplierName("ABC Bullion");
        request.setSupplierInvoiceNo("INV-001");
        request.setItems(List.of());

        assertThrows(IllegalArgumentException.class, () -> purchaseService.createPurchase(request));
    }

    @Test
    void testGetAllPurchases() {
        Purchase p1 = Purchase.builder()
                .id(1L)
                .supplierName("Supplier A")
                .supplierInvoiceNo("SUP-1")
                .purchaseDate(LocalDate.now())
                .items(new ArrayList<>())
                .build();

        when(purchaseRepository.findAllByOrderByPurchaseDateDescIdDesc()).thenReturn(List.of(p1));

        List<PurchaseResponseDTO> result = purchaseService.getAllPurchases();
        assertEquals(1, result.size());
        assertEquals("Supplier A", result.get(0).getSupplierName());
    }

    @Test
    void testGetItemsForPurchase() {
        PurchaseItem item = PurchaseItem.builder()
                .id(10L)
                .sku("SKU-1")
                .productName("Gold Chain")
                .material("Gold")
                .purity("22K")
                .quantity(2)
                .weight(new BigDecimal("10.000"))
                .costPerGram(new BigDecimal("5500.00"))
                .lineTotal(new BigDecimal("55000.00"))
                .hsnCode("7113")
                .build();

        when(purchaseItemRepository.findByPurchase_IdOrderById(1L)).thenReturn(List.of(item));

        List<PurchaseItemResponseDTO> items = purchaseService.getItemsForPurchase(1L);
        assertEquals(1, items.size());
        assertEquals("SKU-1", items.get(0).getSku());
        assertEquals("Gold Chain", items.get(0).getProductName());
    }
}
