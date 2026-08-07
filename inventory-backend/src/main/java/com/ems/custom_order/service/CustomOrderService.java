package com.ems.custom_order.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.ems.Exception.Custom_Exception.CustomOrderNotFoundException;
import com.ems.custom_order.model.CustomOrder;
import com.ems.custom_order.repository.CustomOrderRepository;


import org.springframework.transaction.annotation.Transactional;


@Service
public class CustomOrderService {


    public final CustomOrderRepository customRepository;


    public CustomOrderService(CustomOrderRepository customRepository){
        this.customRepository = customRepository;
    }  
    
    public List<CustomOrder> getAllCustomOrder(){
        return customRepository.findAll();
    }

    public CustomOrder saveCustomOrder(CustomOrder customOrder) {
        return customRepository.save(customOrder);
    }
    
    public CustomOrder getCustomOrderById(Long id) {
        return customRepository.findById(id).get();
    }

    @Transactional
    public CustomOrder updateCustomOrder(Long id , CustomOrder customOrder) {
        CustomOrder exorder = customRepository.findByIdForUpdate(id).orElseThrow(() -> new CustomOrderNotFoundException (id));
        exorder.setAdvanceAmount(customOrder.getAdvanceAmount());
        exorder.setItemName(customOrder.getItemName());
        exorder.setStatus(customOrder.getStatus());
        exorder.setDiamondCarat(customOrder.getDiamondCarat());
        exorder.setDesignRemark(customOrder.getDesignRemark());
        exorder.setGoldCarat(customOrder.getGoldCarat());
        exorder.setMaterialType(customOrder.getMaterialType());
        return customRepository.save(exorder);
        
    }   

    public CustomOrder deleteCustomOrder(Long id) {
        customRepository.deleteById(id);
        return null;
    }       
}
