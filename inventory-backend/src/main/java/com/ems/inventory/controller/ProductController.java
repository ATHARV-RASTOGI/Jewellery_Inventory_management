package com.ems.inventory.controller;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ems.inventory.dto.ProductRequestDTO;
import com.ems.inventory.dto.ProductResponseDTO;
import com.ems.inventory.service.ProductService;
@RestController
@RequestMapping("/api/inventory/products")

public class ProductController {
  
    private final ProductService service;

    public ProductController (ProductService service){
        this.service=service;
    }

    @PostMapping
    public ResponseEntity<ProductRequestDTO> addProduct(@RequestBody ProductRequestDTO newproduct){
        ProductRequestDTO savesProduct=service.saveProduct(newproduct);
        return new ResponseEntity<>(savesProduct,HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductRequestDTO> updateProduct(@PathVariable long id, @RequestBody ProductRequestDTO productdetails){
        ProductRequestDTO updatedProduct = service.updateProduct(id, productdetails);
        return new ResponseEntity<>(updatedProduct, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<ProductResponseDTO>> getProducts(
        @RequestParam(required= false) String mainCategory,
        @RequestParam(required= false) String subCategory,
        @RequestParam(required= false) String purity,
        @RequestParam(required= false) Double maxWeight
    )
    {
        
    List<ProductResponseDTO> products = service.getFilterProducts(mainCategory,subCategory,purity,maxWeight);
    return new ResponseEntity<>(products, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
    service.deleteProduct(id);
    return ResponseEntity.noContent().build();
}

    


}
