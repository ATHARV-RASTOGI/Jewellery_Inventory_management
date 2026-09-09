package com.ems.inventory.service;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.Exception.Custom_Exception.ItemNotFoundException;
import com.ems.inventory.dto.BatchResponseDTO;
import com.ems.inventory.dto.StockInRequestDTO;
import com.ems.inventory.model.Batch;
import com.ems.inventory.model.Product;
import com.ems.inventory.repository.BatchRepository;
import com.ems.inventory.repository.ProductRepository;

import org.modelmapper.ModelMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StockInService {

    private final ProductRepository productRepository;
    
    private final BatchRepository batchRepository;
    
    private final ModelMapper modelMapper;

    @CacheEvict(value = {"products", "inventory_metrics"}, allEntries = true)
    @Transactional
    public BatchResponseDTO addStock(StockInRequestDTO request) {

        Product product = productRepository.findBySkuForUpdate(request.getSku())
                .orElseThrow(() -> new ItemNotFoundException("Product not found with SKU: " + request.getSku()));

        // Ensure stockQuantity is never null
        if (product.getStockQuantity() == null || product.getStockQuantity() < 0) {
            product.setStockQuantity(0);
        }

      
        BigDecimal currentWeight = product.getTotalweight() != null ? product.getTotalweight() : BigDecimal.ZERO;

        product.setTotalweight(currentWeight.add(request.getWeightAdded()));
        product.setStockQuantity(product.getStockQuantity() + request.getQuantityadded());
        productRepository.save(product);

        
        Batch batch = new Batch();
        batch.setProduct(product);
        batch.setQuantity(request.getQuantityadded());
        batch.setWeightAdded(request.getWeightAdded());
        batch.setBatchDate(LocalDate.now());
        batch.setBatchNumber(request.getBatchNumber());
        Batch savedBatch = batchRepository.save(batch);

        return modelMapper.map(savedBatch, BatchResponseDTO.class);
    }

}
