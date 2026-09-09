 package com.ems.inventory.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;


import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.ems.inventory.model.Product;

@DataJpaTest
public class ProductRepositoryTest {

    @Autowired 
    private ProductRepository productRepository;

    // ── 1. Declare class fields accessible by all test methods ──
    private Product goldRing;
    private Product silverKadas;

    private Product createProduct(String name, String sku, String mainCategory, String subCategory, String purity, String material, int stockQuantity, BigDecimal baseWeight) {
        return Product.builder()
                .name(name)
                .sku(sku)
                .mainCategory(mainCategory)
                .subCategory(subCategory)
                .purity(purity)
                .material(material)
                .stockQuantity(stockQuantity)
                .baseWeight(baseWeight)
                .build();
    }
    
    // ── 2. Create sample data ONCE before each test ──
    @BeforeEach 
    void setup() {
        goldRing = productRepository.save(
            createProduct("Gold Ring", "SKU-RING-01", "Rings", "Wedding", "22K", "Gold", 10, new BigDecimal("5.500"))
        );

        silverKadas = productRepository.save(
            createProduct("Silver Kadas", "SKU-KADAS-01", "Kadas", "Daily", "925", "Silver", 5, new BigDecimal("10.000"))
        );
    }

    @Test
    void testFindByIdForUpdate() {
        Optional<Product> found = productRepository.findByIdForUpdate(goldRing.getId());

        assertTrue(found.isPresent());
        assertEquals(goldRing.getId(), found.get().getId());
        assertEquals("SKU-RING-01", found.get().getSku());
    }

    @Test
    void testFindBySku() {
        Optional<Product> found = productRepository.findBySku("SKU-RING-01");

        assertTrue(found.isPresent());
        assertEquals(goldRing.getId(), found.get().getId());
    }

    @Test
    void testFindBySkuForUpdate() {
        Optional<Product> found = productRepository.findBySkuForUpdate("SKU-RING-01");

        assertTrue(found.isPresent());
        assertEquals(goldRing.getId(), found.get().getId());
    }

    @Test
    void testFindByMainCategory() {
        List<Product> found = productRepository.findByMainCategory("Rings");

        assertEquals(1, found.size());
        assertEquals(goldRing.getId(), found.get(0).getId());
    }

    @Test
    void testFindByMainCategoryAndSubCategory() {
        List<Product> found = productRepository.findByMainCategoryAndSubCategory("Rings", "Wedding");

        assertEquals(1, found.size());
        assertEquals(goldRing.getId(), found.get(0).getId());
    }

    @Test
    void testFindByMaterialGold() {
        List<Product> found = productRepository.findByMaterialGold();

        assertEquals(1, found.size());
        assertEquals("Gold", found.get(0).getMaterial());
    }

    @Test
    void testFindByMaterialSilver() {
        List<Product> found = productRepository.findByMaterialSilver();

        assertEquals(1, found.size());
        assertEquals("Silver", found.get(0).getMaterial());
    }

    @Test
    void testCalculateTotalItemsInStock() {
        // 10 gold rings + 5 silver kadas = 15
        Integer totalItems = productRepository.calculateTotalItemsInStock();
        assertEquals(15, totalItems);
    }

    @Test
    void testCountByStockQuantityLessThanEqual() {
        // Threshold 5 matches only silverKadas (qty 5)
        Integer count = productRepository.countByStockQuantityLessThanEqual(5);
        assertEquals(1, count);
    }

    @Test
    void testGetTotalWeightForGold() {
        // 5.500 * 10 = 55.000
        BigDecimal totalWeight = productRepository.getTotalWeightForGold();
        assertEquals(0, new BigDecimal("55.000").compareTo(totalWeight));
    }

    @Test
    void testGetTotalWeightForSilver() {
        // 10.000 * 5 = 50.000
        BigDecimal totalWeight = productRepository.getTotalWeightForSilver();
        assertEquals(0, new BigDecimal("50.000").compareTo(totalWeight));
    }

    @Test
    void testSearchProducts() {
        // Searching for "Ring" matches goldRing
        List<Product> found = productRepository.searchProducts("Ring");
        assertEquals(1, found.size());
        assertEquals("Gold Ring", found.get(0).getName());
    }
}
