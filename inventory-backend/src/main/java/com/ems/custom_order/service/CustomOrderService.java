package com.ems.custom_order.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.ems.Exception.Custom_Exception.CustomOrderNotFoundException;
import com.ems.custom_order.model.CustomOrder;
import com.ems.custom_order.model.OrderStatus;
import com.ems.custom_order.repository.CustomOrderRepository;


import org.springframework.transaction.annotation.Transactional;


@Service
public class CustomOrderService {


    private final CustomOrderRepository customRepository;


    public CustomOrderService(CustomOrderRepository customRepository){
        this.customRepository = customRepository;
    }  
    
    public List<CustomOrder> getAllCustomOrder(){
        return customRepository.findAll();
    }

    public CustomOrder saveCustomOrder(CustomOrder customOrder) {
        if (customOrder.getAdvanceAmount() != null && customOrder.getAdvanceAmount().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Advance amount cannot be negative");
        }
        if (customOrder.getTotalAmount() != null && customOrder.getTotalAmount().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Total amount cannot be negative");
        }
        
        if (customOrder.getOrderId() != null) {
            CustomOrder existing = customRepository.findById(customOrder.getOrderId()).orElse(null);
            if (existing != null && existing.getStatus() == OrderStatus.PICKED_UP) {
                throw new RuntimeException("Cannot update a picked up order");
            }
        }
        if (customOrder.getStatus() == null) {
            customOrder.setStatus(OrderStatus.PENDING);
        }
        return customRepository.save(customOrder);
    }
    
    public CustomOrder getCustomOrderById(Long id) {
        return customRepository.findById(id)
            .orElseThrow(() -> new CustomOrderNotFoundException(id));
    }

    @Transactional
    public CustomOrder updateCustomOrder(Long id , CustomOrder customOrder) {
        CustomOrder exorder = customRepository.findByIdForUpdate(id).orElseThrow(() -> new CustomOrderNotFoundException (id));
        if (exorder.getStatus() == OrderStatus.PICKED_UP) {
            throw new RuntimeException("Cannot update a picked up order");
        }
        exorder.setAdvanceAmount(customOrder.getAdvanceAmount());
        exorder.setItemName(customOrder.getItemName());
        exorder.setStatus(customOrder.getStatus());
        exorder.setDiamondCarat(customOrder.getDiamondCarat());
        exorder.setDesignRemark(customOrder.getDesignRemark());
        exorder.setGoldCarat(customOrder.getGoldCarat());
        exorder.setMaterialType(customOrder.getMaterialType());
        return customRepository.save(exorder);
        
    }   

    public void deleteCustomOrder(Long id) {
        if (!customRepository.existsById(id)) {
            throw new CustomOrderNotFoundException(id);
        }
        customRepository.deleteById(id);
    }       
}
