package com.ems.inventory.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;


import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.ems.inventory.model.Product;

@DataJpaTest
public class ProductRepositoryTest {

    @Autowired 
    private ProductRepository productRepository;

    private Product createProduct(String name , String sku , String mainCategory , String subCategory , String purity , String material , int stockQuantity , BigDecimal totalweight){
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
    
    @Test
    void testCalculateTotalItemsInStock() {


    }

    @Test
    void testCountByStockQuantityLessThanEqual() {

    }

    @Test
    void testFindByIdForUpdate() {

       Product p1=  productRepository.save(createProduct("Ring","RG001","Ring","Gold","18K","Gold",10,new BigDecimal("10.0")));

       Optional<Product> newprod= productRepository.findByIdForUpdate(p1.getId());

       assertTrue(newprod.isPresent());
       assertEquals(p1.getId(), newprod.get().getId());
       assertEquals(p1.getName(), newprod.get().getName());
       assertEquals(p1.getSku(), newprod.get().getSku());
       assertEquals(p1.getMainCategory(), newprod.get().getMainCategory());
       assertEquals(p1.getSubCategory(), newprod.get().getSubCategory());
       assertEquals(p1.getPurity(), newprod.get().getPurity());
       assertEquals(p1.getMaterial(), newprod.get().getMaterial());
       assertEquals(p1.getStockQuantity(), newprod.get().getStockQuantity());
       assertEquals(p1.getTotalweight(), newprod.get().getTotalweight());
    }

    @Test
    void testFindByMainCategory() {

        Product saved = productRepository.save(
                createProduct("Gold Ring", "SKU-RING-01", "Rings", "Wedding", "22K", "Gold", 10, new BigDecimal("5.500")));
        
        List<Product> found = productRepository.findByMainCategory("Rings");

        assertTrue(found.size() > 0);
        assertEquals(saved.getId(), found.get(0).getId());
        assertEquals("Gold Ring", found.get(0).getName());
        assertEquals("Rings", found.get(0).getMainCategory());

    }

    @Test
    void testFindByMainCategoryAndSubCategory() {

         Product saved = productRepository.save(
                createProduct("Gold Ring", "SKU-RING-01", "Rings", "Wedding", "22K", "Gold", 10, new BigDecimal("5.500")));
        
        List<Product> found = productRepository.findByMainCategoryAndSubCategory("Rings", "Wedding");

        assertTrue(found.size() > 0);
        assertEquals(saved.getId(), found.get(0).getId());
        assertEquals("Gold Ring", found.get(0).getName());
        assertEquals("Rings", found.get(0).getMainCategory());
        assertEquals("Wedding", found.get(0).getSubCategory());

    }

    @Test
    void testFindByMainCategoryAndSubCategoryAndPurityAndBaseWeightLessThanEqual() {

         Product saved = productRepository.save(
                createProduct("Gold Ring", "SKU-RING-01", "Rings", "Wedding", "22K", "Gold", 10, new BigDecimal("5.500")));
        
        List<Product> found = productRepository.findByMainCategoryAndSubCategoryAndPurityAndTotalweightLessThanEqual("Rings", "Wedding", "22K", new BigDecimal("5.500"));

        assertTrue(found.size() > 0);
        assertEquals(saved.getId(), found.get(0).getId());
        assertEquals("Gold Ring", found.get(0).getName());
        assertEquals("Rings", found.get(0).getMainCategory());
        assertEquals("Wedding", found.get(0).getSubCategory());
        assertEquals("22K", found.get(0).getPurity());
        assertEquals("Gold", found.get(0).getMaterial());
        assertEquals(10, found.get(0).getStockQuantity());
        assertEquals(new BigDecimal("5.500"), found.get(0).getTotalweight());
        assertThrows(IndexOutOfBoundsException.class , ()->{
            found.get(1);
        });

    }

    @Test
    void testFindByMaterialGold() {

        Product saved = productRepository.save(
                createProduct("Gold Ring", "SKU-RING-01", "Rings", "Wedding", "22K", "Gold", 10, new BigDecimal("5.500")));
        
        List<Product> found = productRepository.findByMaterialGold();

        assertTrue(found.size() > 0);
        assertEquals(saved.getId(), found.get(0).getId());
        assertEquals("Gold Ring", found.get(0).getName());
        assertEquals("Gold", found.get(0).getMaterial());
    }

    @Test
    void testFindByMaterialSilver() {


         Product saved = productRepository.save(
             createProduct("Silver kadas", "SKU-KADAS-0101", "KADAS", "DAILY", "925", "Silver", 34, new BigDecimal("5.500")));
        
        List<Product> found = productRepository.findByMaterialSilver();

        assertEquals(1, found.size());
        assertEquals(saved.getId(), found.get(0).getId());
        assertEquals("Silver kadas", found.get(0).getName());
        assertEquals("Silver", found.get(0).getMaterial());
        
    }

    @Test
    void testFindBySku() {

        Product saved = productRepository.save(
                createProduct("Gold Ring", "SKU-RING-01", "Rings", "Wedding", "22K", "Gold", 10, new BigDecimal("5.500")));

        Optional<Product> found = productRepository.findBySku("SKU-RING-01");

        assertTrue(found.isPresent());
        assertEquals(saved.getId(), found.get().getId());
        assertEquals("Gold Ring", found.get().getName());


    }

    @Test
    void testFindBySkuForUpdate() {

        Product saved = productRepository.save(
                createProduct("Gold Ring", "SKU-RING-01", "Rings", "Wedding", "22K", "Gold", 10, new BigDecimal("5.500")));

        Optional<Product> found = productRepository.findBySkuForUpdate("SKU-RING-01");

        assertTrue(found.isPresent());
        assertEquals(saved.getId(), found.get().getId());
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
    void testGetTotalWeightForGold() {
        
        productRepository.save(
                createProduct("Gold Ring", "SKU-RING-01", "Rings", "Wedding", "22K", "Gold", 10, new BigDecimal("5.500")));
        
        BigDecimal totalWeight = productRepository.getTotalWeightForGold();

        assertEquals(new BigDecimal("5.500"), totalWeight);

    }

    @Test
    void testGetTotalWeightForSilver() {

    }

    @Test
    void testSearchProducts() {

    }
}
