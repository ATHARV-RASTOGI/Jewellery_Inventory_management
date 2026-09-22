package com.ems.purchase.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.purchase.dto.PurchaseItemResponseDTO;
import com.ems.purchase.dto.PurchaseRequestDTO;
import com.ems.purchase.dto.PurchaseResponseDTO;
import com.ems.purchase.service.PurchaseService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
public class PurchaseController {

    private final PurchaseService purchaseService;

    @PostMapping
    public ResponseEntity<PurchaseResponseDTO> createPurchase(@RequestBody PurchaseRequestDTO request) {
        PurchaseResponseDTO response = purchaseService.createPurchase(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PurchaseResponseDTO>> getAllPurchases() {
        return ResponseEntity.ok(purchaseService.getAllPurchases());
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<List<PurchaseItemResponseDTO>> getPurchaseItems(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseService.getItemsForPurchase(id));
    }
}
