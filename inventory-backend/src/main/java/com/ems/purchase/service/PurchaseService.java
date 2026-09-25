package com.ems.purchase.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.Exception.Custom_Exception.ItemNotFoundException;
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

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final StockService stockService;
    private final HsnMasterRepository hsnMasterRepository;

    @Transactional
    @CacheEvict(value = {"products", "inventory_metrics"}, allEntries = true)
    public PurchaseResponseDTO createPurchase(PurchaseRequestDTO request) {
        if (request.getSupplierName() == null || request.getSupplierName().trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier name is required");
        }
        if (request.getSupplierInvoiceNo() == null || request.getSupplierInvoiceNo().trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier invoice number is required");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Purchase must contain at least one item");
        }

        Purchase purchase = Purchase.builder()
                .supplierName(request.getSupplierName().trim())
                .supplierPhone(request.getSupplierPhone() != null ? request.getSupplierPhone().trim() : null)
                .supplierGstin(request.getSupplierGstin() != null ? request.getSupplierGstin().trim() : null)
                .supplierInvoiceNo(request.getSupplierInvoiceNo().trim())
                .purchaseDate(request.getPurchaseDate() != null ? request.getPurchaseDate() : LocalDate.now())
                .items(new ArrayList<>())
                .build();

        Purchase savedPurchase = purchaseRepository.save(purchase);
        List<PurchaseItemResponseDTO> itemResponses = new ArrayList<>();

        for (PurchaseItemRequestDTO itemReq : request.getItems()) {
            String sku = itemReq.getSku();
            if (sku == null || sku.trim().isEmpty()) {
                throw new IllegalArgumentException("SKU is required for purchase item");
            }
            int qty = itemReq.getQuantity() != null ? itemReq.getQuantity() : 0;
            if (qty <= 0) {
                throw new IllegalArgumentException("Quantity must be greater than zero for SKU: " + sku);
            }

            BigDecimal weight = itemReq.getWeight() != null ? itemReq.getWeight() : BigDecimal.ZERO;
            BigDecimal costPerGram = itemReq.getCostPerGram() != null ? itemReq.getCostPerGram() : BigDecimal.ZERO;

            Product product = stockService.increaseStock(sku, qty, weight);

            // Compute Line Total
            BigDecimal lineTotal = itemReq.getLineTotal();
            if (lineTotal == null || lineTotal.compareTo(BigDecimal.ZERO) <= 0) {
                if (weight.compareTo(BigDecimal.ZERO) > 0 && costPerGram.compareTo(BigDecimal.ZERO) > 0) {
                    lineTotal = weight.multiply(costPerGram).setScale(2, RoundingMode.HALF_UP);
                } else if (costPerGram.compareTo(BigDecimal.ZERO) > 0) {
                    lineTotal = costPerGram.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);
                } else {
                    lineTotal = BigDecimal.ZERO;
                }
            }

            // Lookup HSN Code
            String hsnCode = null;
            if (product.getMaterial() != null) {
                hsnCode = hsnMasterRepository.findByMaterialKeyIgnoreCase(product.getMaterial().trim())
                        .map(hsn -> hsn.getHsnCode())
                        .orElse(null);
            }

            PurchaseItem item = PurchaseItem.builder()
                    .purchase(savedPurchase)
                    .sku(sku)
                    .productName(product.getName())
                    .material(product.getMaterial())
                    .purity(product.getPurity())
                    .quantity(qty)
                    .weight(weight)
                    .costPerGram(costPerGram)
                    .lineTotal(lineTotal)
                    .hsnCode(hsnCode)
                    .build();

            PurchaseItem savedItem = purchaseItemRepository.save(item);
            savedPurchase.getItems().add(savedItem);

            itemResponses.add(mapToItemResponse(savedItem));
        }

        return PurchaseResponseDTO.builder()
                .id(savedPurchase.getId())
                .supplierName(savedPurchase.getSupplierName())
                .supplierPhone(savedPurchase.getSupplierPhone())
                .supplierGstin(savedPurchase.getSupplierGstin())
                .supplierInvoiceNo(savedPurchase.getSupplierInvoiceNo())
                .purchaseDate(savedPurchase.getPurchaseDate())
                .itemCount(savedPurchase.getItems().size())
                .items(itemResponses)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PurchaseResponseDTO> getAllPurchases() {
        return purchaseRepository.findAllByOrderByPurchaseDateDescIdDesc().stream()
                .map(p -> PurchaseResponseDTO.builder()
                        .id(p.getId())
                        .supplierName(p.getSupplierName())
                        .supplierPhone(p.getSupplierPhone())
                        .supplierGstin(p.getSupplierGstin())
                        .supplierInvoiceNo(p.getSupplierInvoiceNo())
                        .purchaseDate(p.getPurchaseDate())
                        .itemCount(p.getItems() != null ? p.getItems().size() : 0)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseItemResponseDTO> getItemsForPurchase(Long purchaseId) {
        return purchaseItemRepository.findByPurchase_IdOrderById(purchaseId).stream()
                .map(this::mapToItemResponse)
                .collect(Collectors.toList());
    }

    private PurchaseItemResponseDTO mapToItemResponse(PurchaseItem item) {
        return PurchaseItemResponseDTO.builder()
                .id(item.getId())
                .purchaseId(item.getPurchaseId())
                .sku(item.getSku())
                .productName(item.getProductName())
                .material(item.getMaterial())
                .purity(item.getPurity())
                .quantity(item.getQuantity())
                .weight(item.getWeight())
                .costPerGram(item.getCostPerGram())
                .lineTotal(item.getLineTotal())
                .hsnCode(item.getHsnCode())
                .build();
    }
}
