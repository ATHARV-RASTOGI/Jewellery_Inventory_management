package com.ems.custom_order.service;

import java.math.BigDecimal;
import java.util.List;

import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.ems.Exception.Custom_Exception.CustomOrderNotFoundException;
import com.ems.custom_order.dto.CustomOrderRequestDTO;
import com.ems.custom_order.dto.CustomOrderResponseDTO;
import com.ems.custom_order.model.CustomOrder;
import com.ems.custom_order.model.OrderStatus;
import com.ems.custom_order.repository.CustomOrderRepository;


import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomOrderService {

    private final CustomOrderRepository customRepository;
    private final ModelMapper modelMapper;

    public CustomOrderService(CustomOrderRepository customRepository,ModelMapper modelMapper ) {
        this.customRepository = customRepository;
        this.modelMapper=modelMapper;
    }

    @Cacheable(value = "custom_orders", key = "'all_custom_orders'")
    public List<CustomOrderResponseDTO> getAllCustomOrder() {
        List<CustomOrder> order=customRepository.findAll();
        return order.stream().map(e -> modelMapper.map(e , CustomOrderResponseDTO.class))
        .toList();
    }

    @CacheEvict(value = "custom_orders", allEntries = true)
    @Transactional
    public CustomOrderResponseDTO saveCustomOrder(CustomOrderRequestDTO  order) {

        CustomOrder entity = modelMapper.map(order , CustomOrder.class);
        entity.setOrderId(null);
        
        if (entity.getAdvanceAmount() != null
                && entity.getAdvanceAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Advance amount cannot be negative");
        }
        if (entity.getTotalAmount() != null
                && entity.getTotalAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Total amount cannot be negative");
        }

        if (entity.getStatus() == null) {
            entity.setStatus(OrderStatus.PENDING);
        }

        CustomOrder saved = customRepository.save(entity);
        return modelMapper.map(saved , CustomOrderResponseDTO.class);
    }

    
    public CustomOrderResponseDTO getCustomOrderById(Long id) {
        CustomOrder customOrder = customRepository.findById(id)
                .orElseThrow(() -> new CustomOrderNotFoundException(id));

        return modelMapper.map(customOrder , CustomOrderResponseDTO.class);
    }



    @CacheEvict(value = "custom_orders", allEntries = true)
    @Transactional
    public CustomOrderResponseDTO updateCustomOrder(Long id, CustomOrderRequestDTO incoming) {
    CustomOrder exorder = customRepository.findByIdForUpdate(id)
            .orElseThrow(() -> new CustomOrderNotFoundException(id));

    if (exorder.getStatus() == OrderStatus.PICKED_UP) {
            throw new RuntimeException("Cannot update a picked up order");
        }

    if (incoming.getAdvanceAmount() != null && incoming.getAdvanceAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Advance amount cannot be negative");
        }
    if (incoming.getTotalAmount() != null && incoming.getTotalAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Total amount cannot be negative");
        }

   

    modelMapper.map(incoming, exorder);
    exorder.setLinkedSaleId(incoming.getLinkedSaleId());

    return modelMapper.map(exorder, CustomOrderResponseDTO.class);
}
   
    @CacheEvict(value = "custom_orders", allEntries = true)
    @Transactional
    public void deleteCustomOrder(Long id) {
        if (!customRepository.existsById(id)) {
            throw new CustomOrderNotFoundException(id);
        }
        customRepository.deleteById(id);
    }
}
