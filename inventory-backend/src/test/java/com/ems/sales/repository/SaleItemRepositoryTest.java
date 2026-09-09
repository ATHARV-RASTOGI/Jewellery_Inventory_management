package com.ems.sales.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.ems.sales.model.Saleitem;
import com.ems.sales.model.Sales;

@DataJpaTest 
public class SaleItemRepositoryTest {

    @Autowired 
    private SaleItemRepository salesItemRepository;

    @Autowired 
    private SalesRepository salesRepository;

    private Sales savedSale;
    private Sales otherSale;

    // ── Simplified helper: only pass what actually varies ──
    private Saleitem createItem(Sales sale, String sku, String name, String material, BigDecimal price) {
        return Saleitem.builder()
                .sale(sale)
                .sku(sku)
                .productName(name)
                .material(material)
                .purity("22K")
                .pricePerPiece(price)
                .lineTotal(price)
                .build();
    }

    private Sales createSales() {
        return Sales.builder()
                .customerName("Sample name")
                .customerPhoneNo("1234567890")
                .customerAddress("93 Maha St")
                .subtotal(new BigDecimal("100.00"))
                .gstAmount(new BigDecimal("10.00"))
                .grandTotal(new BigDecimal("110.00"))
                .build();
    }

    // ── Setup shared test data ONCE before each test ──
    @BeforeEach
    void setUp() {
        savedSale = salesRepository.save(createSales());
        salesItemRepository.save(createItem(savedSale, "SKU-RING-01", "Gold Ring", "Gold", new BigDecimal("100.00")));
        salesItemRepository.save(createItem(savedSale, "SKU-NECK-01", "Necklace", "Gold", new BigDecimal("200.00")));

        otherSale = salesRepository.save(createSales());
        salesItemRepository.save(createItem(otherSale, "SKU-SILV-01", "Silver Chain", "Silver", new BigDecimal("150.00")));
    }

    @Test
    void testCountBySale_Id() {
        long count = salesItemRepository.countBySale_Id(savedSale.getId());
        assertEquals(2, count);
    }

    @Test
    void testCountItemsForSales() {
        List<Object[]> find = salesItemRepository.countItemsForSales(List.of(savedSale.getId(), otherSale.getId()));

        assertEquals(savedSale.getId(), find.get(0)[0]);
        assertEquals(2L, find.get(0)[1]);

        assertEquals(otherSale.getId(), find.get(1)[0]);
        assertEquals(1L, find.get(1)[1]);
    }

    @Test
    void testFindBySale_IdOrderById() {
        List<Saleitem> list = salesItemRepository.findBySale_IdOrderById(savedSale.getId());

        assertEquals(2, list.size());
        assertEquals("SKU-RING-01", list.get(0).getSku());
        assertEquals("SKU-NECK-01", list.get(1).getSku());
    }

    @Test
    void testFindMaterialTotalsBetween() {
        LocalDate start = LocalDate.now().minusDays(1);
        LocalDate end = LocalDate.now().plusDays(1);
        
        List<Object[]> results = salesItemRepository.findMaterialTotalsBetween(start, end);

        assertEquals(2, results.size());

        for (Object[] row : results) {
            String material = (String) row[0];
            BigDecimal total = (BigDecimal) row[1];

            if ("Gold".equals(material)) {
                assertEquals(0, new BigDecimal("300.00").compareTo(total)); // 100 + 200
            } else if ("Silver".equals(material)) {
                assertEquals(0, new BigDecimal("150.00").compareTo(total)); // 150
            }
        }
    }
}
