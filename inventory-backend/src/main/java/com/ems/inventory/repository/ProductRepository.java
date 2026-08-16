package com.ems.inventory.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.function.BiConsumer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.inventory.model.Product;

import jakarta.persistence.LockModeType;

public interface ProductRepository extends JpaRepository<Product, Long> {

        List<Product> findByMainCategory(String mainCategory);

        List<Product> findByMainCategoryAndSubCategory(String mainCategory, String subCategory);

        List<Product> findByMainCategoryAndSubCategoryAndPurityAndBaseWeightLessThanEqual(
                        String mainCategory,
                        String subCategory,
                        String purity,
                        Double maxWeight);

        @Query("SELECT p FROM Product p WHERE " +
                        "LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(p.mainCategory) LIKE LOWER(CONCAT('%', :keyword, '%'))")
        List<Product> searchProducts(@Param("keyword") String keyword);

        @Query("SELECT COALESCE(SUM(p.price * p.stockQuantity), 0) FROM Product p")
        public BigDecimal getTotalvalue();

        @Query("SELECT COALESCE(SUM(p.stockQuantity), 0) FROM Product p")
        public Integer calculateTotalItemsInStock();

        Integer countByStockQuantityLessThanEqual(Integer threshold);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT p FROM Product p WHERE p.sku = :sku")
        Optional<Product> findBySkuForUpdate(@Param("sku") String sku);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT p FROM Product p WHERE p.id = :id")
        Optional<Product> findByIdForUpdate(@Param("id") Long id);

        @Query("SELECT p FROM Product p WHERE p.material = 'Gold' ")
        List<Product> findByMaterialGold();

        @Query("SELECT p FROM Product p WHERE p.material = 'Silver' ")
        List<Product> findByMaterialSilver();

       
}
