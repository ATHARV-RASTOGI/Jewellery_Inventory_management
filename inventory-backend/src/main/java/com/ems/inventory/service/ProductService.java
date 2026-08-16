package com.ems.inventory.service;

import java.math.BigDecimal;
import java.util.List;

import java.util.Optional;
import org.springframework.stereotype.Service;

import com.ems.Exception.Custom_Exception.ItemNotFoundException;
import com.ems.inventory.model.Goldrates;
import com.ems.inventory.model.Product;
import com.ems.inventory.model.Silver;
import com.ems.inventory.repository.GoldRateRepository;
import com.ems.inventory.repository.ProductRepository;
import com.ems.inventory.repository.SilverRateRepository;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class ProductService {
  
    private final ProductRepository productRepository;
    
    private final GoldRateRepository goldRateRepository;

    private final SilverRateRepository silverRateRepository;



    @Transactional
    public Product saveProduct(Product newproduct) {
        // Ensure stock is never negative, default to 0 if null
        if (newproduct.getStockQuantity() == null || newproduct.getStockQuantity() < 0) {
            newproduct.setStockQuantity(0);
        }
        return productRepository.save(newproduct);
    }

    
    @Transactional
    public Product updateProduct(long id, Product updatedDetails) {
       Product existingProduct= productRepository.findById(id).orElseThrow(() -> new ItemNotFoundException("Product not found with id: " + id));

    existingProduct.setName(updatedDetails.getName());
    existingProduct.setSku(updatedDetails.getSku());
    existingProduct.setMainCategory(updatedDetails.getMainCategory());
    existingProduct.setSubCategory(updatedDetails.getSubCategory());
    existingProduct.setPurity(updatedDetails.getPurity());
    existingProduct.setBaseWeight(updatedDetails.getBaseWeight());
    // Deliberately NOT updating stockQuantity here to avoid clobbering concurrent sale deductions
    existingProduct.setPrice(updatedDetails.getPrice());


    return productRepository.save(existingProduct);

}

    public List<Product> getFilterProducts(String mainCategory, String subCategory, String purity , Double maxWeight){

        if (mainCategory != null && subCategory != null && purity != null && maxWeight != null) {
        return productRepository.findByMainCategoryAndSubCategoryAndPurityAndBaseWeightLessThanEqual(
                mainCategory, subCategory, purity, maxWeight);
        }
        else if(mainCategory != null && subCategory != null){
            return productRepository.findByMainCategoryAndSubCategory(mainCategory, subCategory);
        }
        else if(mainCategory != null){
            return productRepository.findByMainCategory(mainCategory);
        }
        return productRepository.findAll();
    }

    public List<Product> searchProduct(String keyword) {
        return productRepository.searchProducts(keyword);
    }

    @Transactional
    public void deleteProduct(Long id) {
        if(!productRepository.existsById(id)){
            throw new ItemNotFoundException("Product not found with id: " + id);
        }
            productRepository.deleteById(id);
    }

    public BigDecimal getTotalvalue() {
        BigDecimal total = productRepository.getTotalvalue();
        return total != null ? total : BigDecimal.ZERO;
    }

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


    public Integer getCountOfItemsWithLowStock() {
       return productRepository.countByStockQuantityLessThanEqual(3);
    }
}
