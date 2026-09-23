package com.ems.inventory.service;

import java.math.BigDecimal;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.ems.Exception.Custom_Exception.InsufficientQuantity;
import com.ems.Exception.Custom_Exception.ItemNotFoundException;
import com.ems.inventory.model.Product;
import com.ems.inventory.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StockService {

    private final ProductRepository productRepository;

    @CacheEvict(value = {"products", "inventory_metrics"}, allEntries = true)
    @Transactional(propagation = Propagation.REQUIRED)
    public Product reserveAndDeduct(String sku, int quantity, BigDecimal weightPerPiece) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Invalid Sales: Quantity must be greater than zero!");
        }

        Product product = productRepository.findBySkuForUpdate(sku)
                .orElseThrow(() -> new ItemNotFoundException("Item not found for sku : " + sku));

        int availableStock = product.getStockQuantity() != null ? Math.max(0, product.getStockQuantity()) : 0;
        if (availableStock < quantity) {
            throw new InsufficientQuantity(
                    "Insufficient stock for: " + sku + " (Available: " + availableStock + ")");
        }

        product.setStockQuantity(availableStock - quantity);

        if (weightPerPiece != null) {
            if (weightPerPiece.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Weight cannot be negative");
            }
            BigDecimal currentTotal = product.getTotalweight() != null ? product.getTotalweight() : BigDecimal.ZERO;
            BigDecimal totalSoldWeight = weightPerPiece.multiply(BigDecimal.valueOf(quantity));
            if (totalSoldWeight.compareTo(currentTotal) > 0) {
                throw new InsufficientQuantity(
                        "Sold weight " + totalSoldWeight + "g exceeds stock weight " + currentTotal + "g for " + sku);
            }
            product.setTotalweight(currentTotal.subtract(totalSoldWeight));
        }

        return productRepository.save(product);
    }

    @CacheEvict(value = {"products", "inventory_metrics"}, allEntries = true)
    @Transactional(propagation = Propagation.REQUIRED)
    public Product increaseStock(String sku, int quantityAdded, BigDecimal weightAdded) {
        if (quantityAdded <= 0) {
            throw new IllegalArgumentException("Quantity added must be greater than zero");
        }

        Product product = productRepository.findBySkuForUpdate(sku)
                .orElseThrow(() -> new ItemNotFoundException("Product not found with SKU: " + sku));

        int currentQty = product.getStockQuantity() != null ? Math.max(0, product.getStockQuantity()) : 0;
        product.setStockQuantity(currentQty + quantityAdded);

        if (weightAdded != null) {
            if (weightAdded.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Weight added cannot be negative");
            }
            BigDecimal currentWeight = product.getTotalweight() != null ? product.getTotalweight() : BigDecimal.ZERO;
            product.setTotalweight(currentWeight.add(weightAdded));
        }

        return productRepository.save(product);
    }
}
