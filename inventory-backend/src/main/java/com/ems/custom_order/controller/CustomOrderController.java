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

import com.ems.custom_order.model.CustomOrder;
import com.ems.custom_order.service.CustomOrderService;


@RestController
@RequestMapping("/api/custom-order")
public class CustomOrderController {


    private final CustomOrderService customOrderService;
    
    public CustomOrderController(CustomOrderService customOrderService) {
        this.customOrderService = customOrderService;
    }
    
    @PostMapping("/create-new-order")
    public ResponseEntity<CustomOrder> createNewOrder(@RequestBody CustomOrder order) {
    
        System.out.println("Data Recived from React: "+order);
        CustomOrder newOrder = customOrderService.saveCustomOrder(order);
        return new ResponseEntity<>(newOrder, HttpStatus.CREATED);

    }

    @GetMapping("/get-all-orders")
    public ResponseEntity<List<CustomOrder>> getAllOrders() {
        List<CustomOrder> orders = customOrderService.getAllCustomOrder();
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    @GetMapping("/get-all-ordedrd/{id}")
    public ResponseEntity<CustomOrder> getById(@PathVariable Long id){
        List<CustomOrder> orders = customOrderService.getAllCustomOrder();
        for(CustomOrder order : orders) {
            if(order.getOrderId().equals(id)) {
                return ResponseEntity.ok(order);
            }
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PutMapping("/update-order/{id}")
    public ResponseEntity<CustomOrder> updateOrder(@PathVariable Long id, @RequestBody CustomOrder order) {
        CustomOrder updated = customOrderService.updateCustomOrder(id, order);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/delete-order/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        customOrderService.deleteCustomOrder(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }


    






}
