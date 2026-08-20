package com.ems.custom_order.controller;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.custom_order.dto.CustomOrderRequestDTO;
import com.ems.custom_order.dto.CustomOrderResponseDTO;
import com.ems.custom_order.service.CustomOrderService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/custom-order")
public class CustomOrderController {

    private final CustomOrderService customOrderService;
    
    public CustomOrderController(CustomOrderService customOrderService) {
        this.customOrderService = customOrderService;
    }

    // ── Create a new custom order ────
    @PostMapping
    public ResponseEntity<CustomOrderResponseDTO> createNewOrder(@Valid @RequestBody CustomOrderRequestDTO order) {
        CustomOrderResponseDTO newOrder = customOrderService.saveCustomOrder(order);
        log.info("Custom order created with id: {}", newOrder.getOrderId());
        return new ResponseEntity<>(newOrder, HttpStatus.CREATED);
    }


    @GetMapping
    public ResponseEntity<List<CustomOrderResponseDTO>> getAllOrders() {
        List<CustomOrderResponseDTO> orders = customOrderService.getAllCustomOrder();
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }
    
    @GetMapping("{id}")
    public ResponseEntity<CustomOrderResponseDTO> getById(@PathVariable Long id){
        CustomOrderResponseDTO order = customOrderService.getCustomOrderById(id);
        return ResponseEntity.ok(order);
    }

    @PutMapping("{id}")
    public ResponseEntity<CustomOrderResponseDTO> updateOrder(@PathVariable Long id, @Valid @RequestBody CustomOrderRequestDTO order) {
        CustomOrderResponseDTO updated = customOrderService.updateCustomOrder(id, order);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    
    @DeleteMapping("{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        customOrderService.deleteCustomOrder(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
