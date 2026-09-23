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
import com.ems.inventory.model.Rates;
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
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ItemNotFoundException("Product not found with id: " + id));

        String newSku = updatedDetails.getSku();
        if (newSku != null && !newSku.equals(existingProduct.getSku())) {
            if (productRepository.findBySku(newSku).isPresent()) {
                throw new IllegalStateException("Product already exists with SKU: " + newSku);
            }
            existingProduct.setSku(newSku);
        }

        existingProduct.setName(updatedDetails.getName());
        existingProduct.setMainCategory(updatedDetails.getMainCategory());
        existingProduct.setSubCategory(updatedDetails.getSubCategory());
        existingProduct.setPurity(updatedDetails.getPurity());
        existingProduct.setTotalweight(updatedDetails.getTotalWeight());
        if (updatedDetails.getMaterial() != null) {
            existingProduct.setMaterial(updatedDetails.getMaterial());
        }

        // Deliberately NOT updating stockQuantity here to avoid clobbering concurrent sale deductions
        Product saved = productRepository.save(existingProduct);
        return modelMapper.map(saved, ProductResponseDTO.class);
    }

    @Cacheable(value  = "products", key = "{#mainCategory,#subCategory,#purity,#maxWeight}")
    public List<ProductResponseDTO> getFilterProducts(String mainCategory, String subCategory, String purity , BigDecimal maxWeight){

        String cleanMainCategory = (mainCategory != null && !mainCategory.isBlank()) ? mainCategory.trim() : null;
        String cleanSubCategory = (subCategory != null && !subCategory.isBlank()) ? subCategory.trim() : null;
        String cleanPurity = (purity != null && !purity.isBlank()) ? purity.trim() : null;

        List<Product> products = productRepository.filterProducts(cleanMainCategory, cleanSubCategory, cleanPurity, maxWeight);

        return products.stream()
            .map(prod -> modelMapper.map(prod, ProductResponseDTO.class))
            .toList();
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
        return goldRateRepository.findFirstByOrderByTimestampDescIdDesc()
                .map(Goldrates::getRates)
                .map(Rates::getInr)
                .filter(r -> r.compareTo(BigDecimal.ZERO) > 0)
                .orElse(BigDecimal.ZERO);
    }

    public BigDecimal getlivesilverDouble() {
        return silverRateRepository.findFirstByOrderByTimestampDescIdDesc()
                .map(Silver::getRates)
                .map(Rates::getInr)
                .filter(r -> r.compareTo(BigDecimal.ZERO) > 0)
                .orElse(BigDecimal.ZERO);
    }


    @Cacheable(value  = {"inventory_metrics"} , key = "'low_stock_count'")
    public Integer getCountOfItemsWithLowStock() {
       return productRepository.countByStockQuantityLessThanEqual(3);
    }
}
