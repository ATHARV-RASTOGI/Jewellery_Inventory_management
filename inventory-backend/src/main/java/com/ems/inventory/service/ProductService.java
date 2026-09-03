package com.ems.inventory.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import java.util.Optional;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import com.ems.Exception.Custom_Exception.ItemNotFoundException;
import com.ems.inventory.dto.ProductRequestDTO;
import com.ems.inventory.dto.ProductResponseDTO;
import com.ems.inventory.model.Goldrates;
import com.ems.inventory.model.Product;
import com.ems.inventory.model.Silver;
import com.ems.inventory.repository.GoldRateRepository;
import com.ems.inventory.repository.ProductRepository;
import com.ems.inventory.repository.SilverRateRepository;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class ProductService {
  
    private final ProductRepository productRepository;
    
    private final GoldRateRepository goldRateRepository;

    private final SilverRateRepository silverRateRepository;

    private final ModelMapper modelMapper;




    @CacheEvict(value = {"products" , "inventory_metrics"} , allEntries = true)
    @Transactional
    public ProductResponseDTO saveProduct(ProductRequestDTO newproduct) {

        if(productRepository.findBySku(newproduct.getSku()).isPresent()){
            throw new IllegalStateException("Product already exists with SKU: " + newproduct.getSku());
        }

        Product product =modelMapper.map(newproduct, Product.class);
        // Ensure stock is never negative, default to 0 if null
        if (product.getStockQuantity() == null || product.getStockQuantity() < 0) {
            product.setStockQuantity(0);
        }
        Product saved= productRepository.save(product);
        return modelMapper.map(saved, ProductResponseDTO.class);
        
    }

    @CacheEvict(value = {"products" , "inventory_metrics"} , allEntries = true)
    @Transactional
    public ProductResponseDTO updateProduct(long id, ProductRequestDTO updatedDetails) {
       Product existingProduct= productRepository.findById(id).orElseThrow(() -> new ItemNotFoundException("Product not found with id: " + id));

    existingProduct.setName(updatedDetails.getName());
    existingProduct.setSku(updatedDetails.getSku());
    existingProduct.setMainCategory(updatedDetails.getMainCategory());
    existingProduct.setSubCategory(updatedDetails.getSubCategory());
    existingProduct.setPurity(updatedDetails.getPurity());
    existingProduct.setTotalweight(updatedDetails.getTotalWeight());
   
    // Deliberately NOT updating stockQuantity here to avoid clobbering concurrent sale deductions
    Product saved = productRepository.save(existingProduct);
    return modelMapper.map(saved, ProductResponseDTO.class);

}

    @Cacheable(value  = "products", key = "{#mainCategory,#subCategory,#purity,#maxWeight}")
    public List<ProductResponseDTO> getFilterProducts(String mainCategory, String subCategory, String purity , BigDecimal maxWeight){

        List<Product> products;
        
        if (mainCategory != null && subCategory != null && purity != null && maxWeight != null) {
            products = productRepository.findByMainCategoryAndSubCategoryAndPurityAndTotalweightLessThanEqual(
                mainCategory, subCategory, purity, maxWeight);
        }
        else if(mainCategory != null && subCategory != null){
            products = productRepository.findByMainCategoryAndSubCategory(mainCategory, subCategory);
        }
        else if(mainCategory != null){
            products = productRepository.findByMainCategory(mainCategory);
        }
        else{
            products = productRepository.findAll();
        }
        
        return products.stream()
            .map(prod -> modelMapper.map(prod, ProductResponseDTO.class))
            .toList();
    }

    @Cacheable(value = "products", key = "'search_' + #keyword")
    public List<Product> searchProduct(String keyword) {
        return productRepository.searchProducts(keyword);
    }

    @CacheEvict(value = {"products" ,"inventory_metrics"} , allEntries = true)
    @Transactional
    public void deleteProduct(Long id) {
        if(!productRepository.existsById(id)){
            throw new ItemNotFoundException("Product not found with id: " + id);
        }
            productRepository.deleteById(id);
    }

    
    public BigDecimal getTotalvaluegold(){
        BigDecimal totalgold = productRepository.getTotalWeightForGold();
        return totalgold != null ? totalgold : BigDecimal.ZERO;
    }
    
    public BigDecimal getTotalvaluesilver(){
        BigDecimal totalsilver = productRepository.getTotalWeightForSilver();
        return totalsilver != null ? totalsilver : BigDecimal.ZERO;
    }

    @Cacheable(value = "inventory_metrics" , key = "'total_valuation'")
    public BigDecimal getTotalvalue() {
        
       BigDecimal gold= getTotalvaluegold();
       BigDecimal silver = getTotalvaluesilver();

       BigDecimal goldratreper= getliveGoldRate();
       BigDecimal silverratreper= getlivesilverDouble();


       BigDecimal goldRatePerGram = goldratreper.divide(BigDecimal.TEN, 2, RoundingMode.HALF_UP);
       BigDecimal silverRatePerGram = silverratreper.divide(BigDecimal.TEN, 2, RoundingMode.HALF_UP);

       BigDecimal goldtotalvalue= goldRatePerGram.multiply(gold);
       BigDecimal silvertotalvalue= silverRatePerGram.multiply(silver);
        return goldtotalvalue.add(silvertotalvalue);
       
    }

    @Cacheable(value = "inventory_metrics" , key = "'total_items_count'")
    public Integer getTotalItems() {
        Integer total = productRepository.calculateTotalItemsInStock();
        return total != null ? total : 0;
    }

    public BigDecimal getliveGoldRate() {
    Optional<Goldrates> goldOptional = goldRateRepository.findFirstByOrderByTimestampDesc();
    if (goldOptional.isPresent()) {
        Goldrates latestRate = goldOptional.get();
        if (latestRate.getRates() != null) {
            return latestRate.getRates().getInr();
        }
    }
    return java.math.BigDecimal.ZERO; // Default if no rate found
    }

    public BigDecimal getlivesilverDouble() {
    Optional<Silver> silverOptional = silverRateRepository.findFirstByOrderByTimestampDesc();
    if (silverOptional.isPresent()) {
        Silver latestRate = silverOptional.get();
        if (latestRate.getRates() != null) {
            return latestRate.getRates().getInr();
        }
    }
    return java.math.BigDecimal.ZERO; // Default if no rate found
    }


    @Cacheable(value  = {"inventory_metrics"} , key = "'low_stock_count'")
    public Integer getCountOfItemsWithLowStock() {
       return productRepository.countByStockQuantityLessThanEqual(3);
    }
}
