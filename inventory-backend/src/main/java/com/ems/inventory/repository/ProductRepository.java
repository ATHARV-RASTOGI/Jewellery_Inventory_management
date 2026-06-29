package com.ems.inventory.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.inventory.model.Product;


public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // --- THIS IS THE MAGIC LINE WE NEEDED TO ADD ---
    List<Product> findByMainCategoryOrSubCategory(String mainCategory, String subCategory);

    // Your existing methods:
    List<Product> findByMainCategory(String mainCategory);
    
    List<Product> findByMainCategoryAndSubCategory(String mainCategory, String subCategory);

    List<Product> findByMainCategoryAndSubCategoryAndPurityAndBaseWeightLessThanEqual(
            String mainCategory, 
            String subCategory, 
            String purity, 
            Double maxWeight
    );

   @Query("SELECT p FROM Product p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.mainCategory) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Product> searchProducts(@Param("keyword") String keyword);

    @Query("SELECT COALESCE(SUM(p.price * p.stockQuantity), 0.0) FROM Product p")
    public Double getTotalvalue();

    @Query("SELECT COALESCE(SUM(p.stockQuantity), 0) FROM Product p")
    public Integer calculateTotalItemsInStock();

    Integer countByStockQuantityLessThanEqual(Integer threshold);

        Optional<Product> findBySku(String sku);
}