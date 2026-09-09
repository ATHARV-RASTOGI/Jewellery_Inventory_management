package com.ems.sales.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentMatchers;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.ems.inventory.model.Product;
import com.ems.inventory.repository.GoldRateRepository;
import com.ems.inventory.repository.ProductRepository;
import com.ems.inventory.repository.SilverRateRepository;
import com.ems.sales.dto.SalesRequestDTO;
import com.ems.sales.dto.SalesResponseDTO;
import com.ems.sales.dto.SalesitemRequestDTO;
import com.ems.sales.dto.SalesitemResponseDTO;
import com.ems.sales.model.Saleitem;
import com.ems.sales.model.Sales;
import com.ems.sales.repository.SaleItemRepository;
import com.ems.sales.repository.SalesRepository;

@ExtendWith(MockitoExtension.class)
public class SalesServiceTest {

    @Mock 
    private ProductRepository productRepository;
    @Mock 
    private SaleItemRepository  saleItemRepository;
    @Mock 
    private SalesRepository saleRepository;
    @Mock 
    private GoldRateRepository goldRateRepository;
    @Mock 
    private SilverRateRepository silverRateRepository;
    
    @Mock 
    private ModelMapper modelMapper;
    
    @InjectMocks 
    private SalesService salesService;


    @Test
    void testCreatesales() {

        //arrange
        SalesitemRequestDTO itemsRequest = new SalesitemRequestDTO();
        itemsRequest.setSku("SKU-RING-01");
        itemsRequest.setQuantity(3);
        itemsRequest.setAppliedRatePer10g(new BigDecimal("10020"));
        itemsRequest.setMakingChargeAmount(new BigDecimal("100"));
        itemsRequest.setMakingChargePercent(new BigDecimal("10"));
        itemsRequest.setPricePerPiece(new BigDecimal("1000"));

        SalesRequestDTO requestDTO = new SalesRequestDTO();
        requestDTO.setCustomerAddress("4293 17 Ave NW, Edmonton, AB T6L 6R1");
        requestDTO.setCustomerName("Karen");
        requestDTO.setCustomerPhoneNo("889032809");
        requestDTO.setItems(List.of(itemsRequest));

        Product product = Product
        .builder().sku("SKU-RING-00191").stockQuantity(10).purity("22K").name("Gold Ring").material("Gold").baseWeight(new BigDecimal("5.0")).build();

        Sales savedSales = Sales.builder().id(1L).customerName("Karen").items(new ArrayList<>()).build();
        SalesResponseDTO expectedresponse = new SalesResponseDTO();
        expectedresponse.setId(1L);
        expectedresponse.setCustomerName("Karen");

        when(saleRepository.save(ArgumentMatchers.any(Sales.class))).thenReturn(savedSales);
        when(productRepository.findBySkuForUpdate("SKU-RING-01")).thenReturn(Optional.of(product));
        when(saleItemRepository.countBySale_Id(ArgumentMatchers.any())).thenReturn(1L);
        when(modelMapper.map(ArgumentMatchers.any(Sales.class), ArgumentMatchers.eq(SalesResponseDTO.class)))
                .thenReturn(expectedresponse);
    
        SalesResponseDTO actualresponse = salesService.createsales(requestDTO);

        assertNotNull(actualresponse);
        assertEquals("Karen", actualresponse.getCustomerName());
        assertEquals(7, product.getStockQuantity());

        verify(saleRepository, times(2)).save(ArgumentMatchers.any(Sales.class));
        verify(productRepository).findBySkuForUpdate("SKU-RING-01");
        verify(saleItemRepository).countBySale_Id(ArgumentMatchers.any());
        verify(modelMapper).map(ArgumentMatchers.any(Sales.class), ArgumentMatchers.eq(SalesResponseDTO.class));
    }

    @Test
    void testGetAllSales() {

        //arrange 
        Sales sales = Sales.builder().id(1L).customerName("Kevin").build();
        SalesResponseDTO salesResponseDTO = new SalesResponseDTO();
        salesResponseDTO.setId(1L);
        salesResponseDTO.setCustomerName("Kevin");


        when(saleRepository.findAllByOrderBySaleDateDesc()).thenReturn(List.of(sales));
        when(modelMapper.map(sales, SalesResponseDTO.class)).thenReturn(salesResponseDTO);

        //act
        List<SalesResponseDTO> result=salesService.getAllSales();

        //assert 
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals("Kevin", result.get(0).getCustomerName());

        verify(saleRepository).findAllByOrderBySaleDateDesc();
        verify(modelMapper).map(sales, SalesResponseDTO.class);
    }

    @Test
    void testGetItemsForSale() {

        Saleitem item = Saleitem.builder().id(1L).productName("Gold ring").build();
        SalesitemResponseDTO dto = new SalesitemResponseDTO();
        dto.setId(10L);
        dto.setProductName("Gold ring");

        when(saleItemRepository.findBySale_IdOrderById(1L)).thenReturn(List.of(item));
        when(modelMapper.map(item , SalesitemResponseDTO.class)).thenReturn(dto);

        List<SalesitemResponseDTO> result=salesService.getItemsForSale(1L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Gold ring", result.get(0).getProductName());

        verify(saleItemRepository).findBySale_IdOrderById(1L);
        verify(modelMapper).map(item, SalesitemResponseDTO.class);

    }

    @Test
    void testGetMonthlyRevenue() {
        int currentYear = LocalDate.now().getYear();
        LocalDate start = LocalDate.of(currentYear, 1, 1);
        LocalDate end = LocalDate.now();

        List<Object[]> mockRows = new ArrayList<>();
        mockRows.add(new Object[]{1, 5000.0}); // Month 1 (January), revenue 5000.0

        when(saleRepository.findMonthlyRevenueBetween(start, end)).thenReturn(mockRows);

        List<Map<String, Object>> result = salesService.getMonthlyRevenue();

        assertNotNull(result);
        assertEquals(12, result.size());

        Map<String, Object> jan = result.get(0);
        assertEquals("Jan", jan.get("month"));
        assertEquals(5000L, jan.get("revenue"));

        Map<String, Object> feb = result.get(1);
        assertEquals("Feb", feb.get("month"));
        assertEquals(0L, feb.get("revenue"));

        verify(saleRepository).findMonthlyRevenueBetween(start, end);
    }

    @Test
    void testGetRecentSales() {
        Sales sale = Sales.builder().id(1L).customerName("Kevin").build();
        Page<Sales> page = new PageImpl<>(List.of(sale));
        SalesResponseDTO dto = new SalesResponseDTO();
        dto.setId(1L);
        dto.setCustomerName("Kevin");

        List<Object[]> countRows = new ArrayList<>();
        countRows.add(new Object[]{1L, 2}); // saleId 1 has 2 items

        when(saleRepository.findAllByOrderBySaleDateDesc(PageRequest.of(0, 5))).thenReturn(page);
        when(saleItemRepository.countItemsForSales(List.of(1L))).thenReturn(countRows);
        when(modelMapper.map(sale, SalesResponseDTO.class)).thenReturn(dto);

        List<SalesResponseDTO> result = salesService.getRecentSales(5);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals("Kevin", result.get(0).getCustomerName());
        assertEquals(2, sale.getItemCount());

        verify(saleRepository).findAllByOrderBySaleDateDesc(PageRequest.of(0, 5));
        verify(saleItemRepository).countItemsForSales(List.of(1L));
        verify(modelMapper).map(sale, SalesResponseDTO.class);
    }

    @Test
    void testGetSalesByMaterial() {

        int curentyear = LocalDate.now().getYear();
        LocalDate start = LocalDate.of(curentyear, 1, 1);
        LocalDate end = LocalDate.now();

        List<Object[]> mock = new ArrayList<>();
        mock.add(new Object[]{"Gold", 1000.0});
        when(saleItemRepository.findMaterialTotalsBetween(start, end)).thenReturn(mock);

        List<Map<String,Object>> result = salesService.getSalesByMaterial();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Gold", result.get(0).get("material"));
        assertEquals(1000L, result.get(0).get("value")); // Math.round returns Long
        // 4. Verify: verify repository was queried with expected date range
        verify(saleItemRepository).findMaterialTotalsBetween(start, end);
    }

    @Test
    void testGetWeeklySales() {

        LocalDate today = LocalDate.now();
        LocalDate weekstart = today.minusDays(6);

        List<Object[]> mockrows = new ArrayList<>();
        mockrows.add(new Object[]{weekstart , 1500.0 });

        when(saleRepository.findDailyRevenueBetween(weekstart, today)).thenReturn(mockrows);

        List<Map<String,Object>> result = salesService.getWeeklySales();
        assertNotNull(result);
        assertEquals(7, result.size());
        
        Map<String, Object> firstEntry = result.get(0);
        String expectedDayName = weekstart.getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH);
        assertEquals(expectedDayName, firstEntry.get("day"));
        assertEquals(1500L, firstEntry.get("sales"));
        verify(saleRepository).findDailyRevenueBetween(weekstart, today);
    }
}
