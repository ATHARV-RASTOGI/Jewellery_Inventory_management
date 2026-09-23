package com.ems.inventory.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.inventory.model.Product;

import jakarta.persistence.LockModeType;

public interface ProductRepository extends JpaRepository<Product, Long> {

        List<Product> findByMainCategory(String mainCategory);

        List<Product> findByMainCategoryAndSubCategory(String mainCategory, String subCategory);

        List<Product> findByMainCategoryAndSubCategoryAndPurityAndTotalweightLessThanEqual(
                        String mainCategory,
                        String subCategory,
                        String purity,
                        BigDecimal maxWeight);

        @Query("SELECT p FROM Product p WHERE " +
               "(:mainCategory IS NULL OR p.mainCategory = :mainCategory) AND " +
               "(:subCategory IS NULL OR p.subCategory = :subCategory) AND " +
               "(:purity IS NULL OR p.purity = :purity) AND " +
               "(:maxWeight IS NULL OR p.totalweight <= :maxWeight)")
        List<Product> filterProducts(
                @Param("mainCategory") String mainCategory,
                @Param("subCategory") String subCategory,
                @Param("purity") String purity,
                @Param("maxWeight") BigDecimal maxWeight);

        @Query("SELECT COALESCE(SUM(p.totalweight), 0) FROM Product p WHERE p.material = 'Gold'")
        BigDecimal getTotalWeightForGold();

        @Query("SELECT COALESCE(SUM(p.totalweight), 0) FROM Product p WHERE p.material = 'Silver'")
        BigDecimal getTotalWeightForSilver();

        @Query("SELECT COALESCE(SUM(p.stockQuantity), 0) FROM Product p")
        public Integer calculateTotalItemsInStock();

        Integer countByStockQuantityLessThanEqual(Integer threshold);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT p FROM Product p WHERE p.sku = :sku")
        Optional<Product> findBySkuForUpdate(@Param("sku") String sku);

        @Query("SELECT p FROM Product p WHERE p.sku = :sku ")
        Optional<Product> findBySku(@Param("sku") String sku);       
}
