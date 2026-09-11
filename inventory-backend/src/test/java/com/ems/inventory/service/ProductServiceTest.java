package com.ems.inventory.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

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

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private GoldRateRepository goldRateRepository;
    @Mock
    private SilverRateRepository silverRateRepository;
    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private ProductService productService;

    private ProductRequestDTO requestDTO;
    private Product product;
    private ProductResponseDTO responseDTO;

    @BeforeEach
    void setup() {

        requestDTO = new ProductRequestDTO();
        requestDTO.setSku("SKU001");
        requestDTO.setName("ring");
        requestDTO.setStockQuantity(80);
        requestDTO.setMaterial("Gold");
        requestDTO.setMainCategory("Gold");
        requestDTO.setSubCategory("Jhumka");
        requestDTO.setPurity("22 K");
        requestDTO.setBaseWeight(new BigDecimal("2.0"));

        product = Product.builder()
                .sku("SKU001")
                .name("ring")
                .stockQuantity(80)
                .build();

        responseDTO = new ProductResponseDTO();
        responseDTO.setId(1L);
        responseDTO.setSku("SKU001");
        responseDTO.setName("ring");
        responseDTO.setStockQuantity(80);

        
    }

    private Goldrates createGoldRate(LocalDate timestamp, BigDecimal inr) {
        Rates rates = new Rates();
        rates.setInr(inr);
        return Goldrates.builder()
                .timestamp(timestamp)
                .rates(rates)
                .build();
    }

    private Silver createSilverRate(LocalDate timestamp, BigDecimal inr) {
        Rates rates = new Rates();
        rates.setInr(inr);
        return Silver.builder()
                .timestamp(timestamp)
                .rates(rates)
                .build();
    }


    @Test
    void testDeleteProduct() {

        Long id = 1L;
        when(productRepository.existsById(id)).thenReturn(true);
        productService.deleteProduct(id);
        verify(productRepository).deleteById(id);
    }

    @Test
    void testDeleteProduct_ThrowsException_WhenNotFound() {
        Long id = 1L;
        when(productRepository.existsById(id)).thenReturn(false);
        assertThrows(ItemNotFoundException.class, () -> productService.deleteProduct(id));
        verify(productRepository).existsById(id);
    }


    @Test
    void testGetTotalvaluegold() {
    
        BigDecimal expected = BigDecimal.valueOf(10);
        when(productRepository.getTotalWeightForGold()).thenReturn(null);
        when(productRepository.getTotalWeightForGold()).thenReturn(BigDecimal.TEN);
      

        BigDecimal totalweight = productService.getTotalvaluegold();

        assertEquals(expected, totalweight);

        verify(productRepository).getTotalWeightForGold();

    }

    @Test
    void testGetTotalvaluesilver() {

        
        BigDecimal expected = BigDecimal.valueOf(10);
        when(productRepository.getTotalWeightForSilver()).thenReturn(null);
        when(productRepository.getTotalWeightForSilver()).thenReturn(BigDecimal.TEN);
      

        BigDecimal totalweight = productService.getTotalvaluesilver();

        assertEquals(expected, totalweight);

        verify(productRepository).getTotalWeightForSilver();

    }

    

    @Test
    void testSaveProduct() {

        when(productRepository.findBySku("SKU001")).thenReturn(Optional.empty());
        when(modelMapper.map(requestDTO, Product.class)).thenReturn(product);
        when(productRepository.save(product)).thenReturn(product);
        when(modelMapper.map(product, ProductResponseDTO.class)).thenReturn(responseDTO);

        ProductResponseDTO saved = productService.saveProduct(requestDTO);

        assertNotNull(saved);
        assertEquals("ring", saved.getName());
        assertEquals(80, saved.getStockQuantity());
        assertEquals("SKU001", saved.getSku());

        verify(productRepository).findBySku("SKU001");
        verify(productRepository).save(product);
        verify(modelMapper).map(requestDTO, Product.class);
        verify(modelMapper).map(product, ProductResponseDTO.class);

    }

    @Test
    void testUpdateProduct_ThrowsException_WhenNotFound() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ItemNotFoundException.class, () -> productService.updateProduct(99L, requestDTO));

        verify(productRepository).findById(99L);
        verify(productRepository, never()).save(any());
    }

    @Test
    void testSaveProduct_ThrowsException_WhenSkuAlreadyExists() {

        ProductRequestDTO requestDTO = new ProductRequestDTO();
        requestDTO.setSku("SKU001");

        Product existing = Product.builder().sku("SKU001").build();

        when(productRepository.findBySku("SKU001")).thenReturn(Optional.of(existing));

        assertThrows(IllegalStateException.class, () -> productService.saveProduct(requestDTO));

        verify(productRepository).findBySku("SKU001");
        verify(productRepository, never()).save(any());
    }

    @Test
    void testSearchProduct() {

        String keyword = "ring";
        when(productRepository.searchProducts(keyword)).thenReturn(List.of(product));

        List<Product> result = productService.searchProduct(keyword);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("ring", result.get(0).getName());
        assertEquals("SKU001", result.get(0).getSku());

        verify(productRepository).searchProducts(keyword);
    }

    @Test
    void testUpdateProduct() {

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);
        when(modelMapper.map(product, ProductResponseDTO.class)).thenReturn(responseDTO);

        ProductResponseDTO update = productService.updateProduct(1L, requestDTO);

        assertNotNull(update);
        assertEquals("ring", update.getName());
        assertEquals(80, update.getStockQuantity());
        assertEquals("SKU001", update.getSku());

        verify(productRepository).findById(1L);
        verify(productRepository).save(product);
        verify(modelMapper).map(product, ProductResponseDTO.class);

    }

    @Test
    void testGetliveGoldRate() {

        Goldrates rate = createGoldRate(LocalDate.now(), new BigDecimal("51989"));

        when(goldRateRepository.findFirstByOrderByTimestampDesc()).thenReturn(Optional.of(rate));
        BigDecimal goldrate = productService.getliveGoldRate();
        assertEquals(new BigDecimal("51989"), goldrate);
        verify(goldRateRepository).findFirstByOrderByTimestampDesc();
    }

    @Test
    void testGetlivesilverDouble() {

        Silver rate = createSilverRate(LocalDate.now(), new BigDecimal("71989"));

        when(silverRateRepository.findFirstByOrderByTimestampDesc()).thenReturn(Optional.of(rate));
        BigDecimal silverrate = productService.getlivesilverDouble();
        assertEquals(new BigDecimal("71989"), silverrate);
        verify(silverRateRepository).findFirstByOrderByTimestampDesc();
    }

    @Test
    void testGetCountOfItemsWithLowStock() {

        Integer items = 3;
        when(productRepository.countByStockQuantityLessThanEqual(items)).thenReturn(5);
        Integer lowStockCount = productService.getCountOfItemsWithLowStock();
        assertEquals(5, lowStockCount);
        verify(productRepository).countByStockQuantityLessThanEqual(items);
    }

    @Test
    void testGetTotalItems() {

        Integer total = 10;
       
        when(productRepository.calculateTotalItemsInStock()).thenReturn(10);
        Integer count = productService.getTotalItems();

        assertEquals(total, count);
        verify(productRepository).calculateTotalItemsInStock();
    }

    @Test
    void testGetFilterProducts() {
        String mainCat = "Gold";
        String subCat = "Ring";
        String purity = "22K";
        BigDecimal maxWeight = new BigDecimal("5.0");

        when(productRepository.findByMainCategoryAndSubCategoryAndPurityAndTotalweightLessThanEqual(mainCat,subCat,purity,maxWeight)).thenReturn(List.of(product));
        List<ProductResponseDTO> filterProducts = productService.getFilterProducts(mainCat, subCat, purity, maxWeight);
        assertEquals(1, filterProducts.size());
        verify(productRepository).findByMainCategoryAndSubCategoryAndPurityAndTotalweightLessThanEqual(mainCat,subCat,purity,maxWeight);
    }

    @Test
    void testGetFilterProducts_WhenNoFilters_ReturnsAll() {
        when(productRepository.findAll()).thenReturn(List.of(product));
        when(modelMapper.map(product, ProductResponseDTO.class)).thenReturn(responseDTO);

        List<ProductResponseDTO> result = productService.getFilterProducts(null, null, null, null);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("ring", result.get(0).getName());

        verify(productRepository).findAll();
        verify(modelMapper).map(product, ProductResponseDTO.class);
    }


       @Test
    void testGetTotalvalue() {
        // 1. Arrange: Stub the underlying repositories
        BigDecimal goldWeight = new BigDecimal("10.0");   // 10 grams of gold
        BigDecimal silverWeight = new BigDecimal("20.0"); // 20 grams of silver

        // 60,000 per 10g => 6,000/g
        Goldrates goldRate = createGoldRate(LocalDate.now(), new BigDecimal("60000"));
        // 800 per 10g => 80/g
        Silver silverRate = createSilverRate(LocalDate.now(), new BigDecimal("800"));

        when(productRepository.getTotalWeightForGold()).thenReturn(goldWeight);
        when(productRepository.getTotalWeightForSilver()).thenReturn(silverWeight);
        when(goldRateRepository.findFirstByOrderByTimestampDesc()).thenReturn(Optional.of(goldRate));
        when(silverRateRepository.findFirstByOrderByTimestampDesc()).thenReturn(Optional.of(silverRate));

        BigDecimal totalvalue = productService.getTotalvalue();

        BigDecimal expectedTotal = new BigDecimal("61600");
        assertEquals(0, expectedTotal.compareTo(totalvalue));

        verify(productRepository).getTotalWeightForGold();
        verify(productRepository).getTotalWeightForSilver();
        verify(goldRateRepository).findFirstByOrderByTimestampDesc();
        verify(silverRateRepository).findFirstByOrderByTimestampDesc();
    }

}
