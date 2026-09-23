package com.ems.inventory.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

    private Product createProduct(String name, String sku, String mainCategory, String subCategory, String purity, String material, int stockQuantity, BigDecimal totalweight) {
        return Product.builder()
                .name(name)
                .sku(sku)
                .mainCategory(mainCategory)
                .subCategory(subCategory)
                .purity(purity)
                .material(material)
                .stockQuantity(stockQuantity)
                .totalweight(totalweight)
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
    void testFindBySku() {
        Optional<Product> found = productRepository.findBySku("SKU-RING-01");

        assertTrue(found.isPresent());
        assertEquals(goldRing.getId(), found.get().getId());
        assertEquals("Gold Ring", found.get().getName());
        assertEquals("SKU-RING-01", found.get().getSku());
        assertEquals("Rings", found.get().getMainCategory());
        assertEquals("Wedding", found.get().getSubCategory());
        assertEquals("22K", found.get().getPurity());
        assertEquals("Gold", found.get().getMaterial());
        assertEquals(10, found.get().getStockQuantity());
        assertEquals(new BigDecimal("5.500"), found.get().getTotalweight());
    }

    @Test
    void testFindBySkuForUpdate() {
        Optional<Product> found = productRepository.findBySkuForUpdate("SKU-RING-01");

        assertTrue(found.isPresent());
        assertEquals(goldRing.getId(), found.get().getId());
        assertEquals("Gold Ring", found.get().getName());
        assertEquals("SKU-RING-01", found.get().getSku());
        assertEquals("Rings", found.get().getMainCategory());
        assertEquals("Wedding", found.get().getSubCategory());
        assertEquals("22K", found.get().getPurity());
        assertEquals("Gold", found.get().getMaterial());
        assertEquals(10, found.get().getStockQuantity());
        assertEquals(new BigDecimal("5.500"), found.get().getTotalweight());
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
        assertEquals("Gold Ring", found.get(0).getName());
        assertEquals("Rings", found.get(0).getMainCategory());
        assertEquals("Wedding", found.get(0).getSubCategory());
    }

    @Test
    void testFindByMainCategoryAndSubCategoryAndPurityAndTotalweightLessThanEqual() {
        List<Product> found = productRepository.findByMainCategoryAndSubCategoryAndPurityAndTotalweightLessThanEqual(
                "Rings", "Wedding", "22K", new BigDecimal("5.500"));

        assertEquals(1, found.size());
        assertEquals(goldRing.getId(), found.get(0).getId());
        assertEquals("Gold Ring", found.get(0).getName());
        assertEquals("Rings", found.get(0).getMainCategory());
        assertEquals("Wedding", found.get(0).getSubCategory());
        assertEquals("22K", found.get(0).getPurity());
        assertEquals("Gold", found.get(0).getMaterial());
        assertEquals(10, found.get(0).getStockQuantity());
        assertEquals(new BigDecimal("5.500"), found.get(0).getTotalweight());
    }

    @Test
    void testCalculateTotalItemsInStock() {
        // 10 gold rings + 5 silver kadas = 15
        Integer totalItems = productRepository.calculateTotalItemsInStock();
        assertEquals(15, totalItems);
    }

    @Test
    void testFilterProducts_SingleFilterPurity() {
        List<Product> found = productRepository.filterProducts(null, null, "22K", null);
        assertEquals(1, found.size());
        assertEquals(goldRing.getId(), found.get(0).getId());
        assertEquals("22K", found.get(0).getPurity());
    }

    @Test
    void testFilterProducts_SingleFilterMaxWeight() {
        List<Product> found = productRepository.filterProducts(null, null, null, new BigDecimal("6.000"));
        assertEquals(1, found.size());
        assertEquals(goldRing.getId(), found.get(0).getId());
    }

    @Test
    void testFilterProducts_AllNull_ReturnsAll() {
        List<Product> found = productRepository.filterProducts(null, null, null, null);
        assertEquals(2, found.size());
    }

    @Test
    void testFilterProducts_Combined() {
        List<Product> found = productRepository.filterProducts("Rings", "Wedding", "22K", new BigDecimal("6.000"));
        assertEquals(1, found.size());
        assertEquals(goldRing.getId(), found.get(0).getId());
    }

}