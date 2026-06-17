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

import com.ems.inventory.model.Product;
import com.ems.inventory.service.ProductService;



@RestController
@RequestMapping("/api/inventory/products")
public class ProductController {
  
    private ProductService service;

    public ProductController (ProductService service){
        this.service=service;
    }

    @PostMapping
    public ResponseEntity<Product> addProduct(@RequestBody Product newproduct){
        Product savesProduct=service.saveProduct(newproduct);
        return new ResponseEntity<>(savesProduct,HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable long id, @RequestBody Product productdetails){
        Product updatedProduct = service.updateProduct(id, productdetails);
        return new ResponseEntity<>(updatedProduct, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<Product>> getProducts(
        @RequestParam(required= false) String mainCategory,
        @RequestParam(required= false) String subCategory,
        @RequestParam(required= false) String purity,
        @RequestParam(required= false) Double maxWeight
    ){
        
    List<Product> products = service.getFilterProducts(mainCategory,subCategory,purity,maxWeight);
    return new ResponseEntity<>(products, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
    service.deleteProduct(id);
    return ResponseEntity.noContent().build();
}

    


}
