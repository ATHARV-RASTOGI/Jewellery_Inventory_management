package com.ems.inventory.service;

import java.time.LocalDate;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.inventory.dto.BatchResponseDTO;
import com.ems.inventory.dto.StockInRequestDTO;
import com.ems.inventory.model.Batch;
import com.ems.inventory.model.Product;
import com.ems.inventory.repository.BatchRepository;

import org.modelmapper.ModelMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StockInService {

    private final StockService stockService;
    
    private final BatchRepository batchRepository;
    
    private final ModelMapper modelMapper;

    @CacheEvict(value = {"products", "inventory_metrics"}, allEntries = true)
    @Transactional
    public BatchResponseDTO addStock(StockInRequestDTO request) {

        Product product = stockService.increaseStock(request.getSku(), request.getQuantityadded(), request.getWeightAdded());

        
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
