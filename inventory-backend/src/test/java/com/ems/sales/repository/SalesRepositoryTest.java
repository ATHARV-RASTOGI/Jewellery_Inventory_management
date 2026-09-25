package com.ems.sales.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.aspectj.lang.annotation.Before;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;


import com.ems.sales.model.Saleitem;
import com.ems.sales.model.Sales;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@DataJpaTest 
public class SalesRepositoryTest {

    @Autowired 
    private SalesRepository salesRepository;

    private Sales saved,saved2;
    private Saleitem salesitem;

    private static long invoiceSeq = 1;

    private Sales createSales( String name , String fathername, String PhoneNo, String Address, double subtotal, double GstAmount, double grandTotal, LocalDate date) {
            return Sales.builder()
                .customerName(name)
                .customerPhoneNo(PhoneNo)
                .customerAddress(Address)
                .subtotal(BigDecimal.valueOf(subtotal))
                .gstAmount(BigDecimal.valueOf(GstAmount))
                .grandTotal(BigDecimal.valueOf(grandTotal))
                .saleDate(date)
                .invoiceNumber("INV/2026-27/" + String.format("%04d", invoiceSeq++))
                .build();
    }

    @BeforeEach 
    void setup(){
        saved = salesRepository.save(createSales("Kavin","Kandasamy","1234567890","93 Maha St",100.00,10.00,110.00, LocalDate.now().minusDays(1)));
        saved2= salesRepository.save(createSales("Surya","Kandasamy","1234567890","93 Maha St",100.00,10.00,110.00, LocalDate.now().minusDays(2)));
    }

    @Test
    void testFindAllByOrderBySaleDateDesc() {
    
      List<Sales> list = salesRepository.findAllByOrderBySaleDateDesc();

      assertEquals(saved.getCustomerName(), list.get(0).getCustomerName());

      assertEquals( saved.getSaleDate(), list.get(0).getSaleDate());
      assertEquals(saved2.getSaleDate(), list.get(1).getSaleDate());
    }

    @Test
    void testFindAllByOrderBySaleDateDesc2() {

        Pageable pageable = PageRequest.of(0, 10);

        Page<Sales> page = salesRepository.findAllByOrderBySaleDateDesc(pageable);

         assertEquals(saved.getCustomerName(), page.getContent().get(0).getCustomerName());
        assertEquals(saved.getSaleDate(), page.getContent().get(0).getSaleDate());   // Newest first
        assertEquals(saved2.getSaleDate(), page.getContent().get(1).getSaleDate());

    }

    @Test
    void testFindDailyRevenueBetween() {

        LocalDate start = LocalDate.now().minusDays(2);
        LocalDate end = LocalDate.now();

        List<Object[]> list = salesRepository.findDailyRevenueBetween(start, end);

         assertEquals(2, list.size());

        for(Object[] row : list){
            LocalDate date = (LocalDate) row[0];
            BigDecimal total = (BigDecimal) row[1];

            if(date.equals(saved.getSaleDate())){

                assertEquals(0,saved.getGrandTotal().compareTo(total));
            }else if(date.equals(saved2.getSaleDate())){
                assertEquals(0,saved2.getGrandTotal().compareTo(total));
            }
        }
 
    }

    @Test
    void testFindMonthlyRevenueBetween() {

        BigDecimal expectedMonthlyTotal = saved.getGrandTotal().add(saved2.getGrandTotal());
        int expectedMonth = LocalDate.now().getMonthValue();
        LocalDate start = LocalDate.now().minusDays(5);
        LocalDate end = LocalDate.now();
     List<Object[]> list = salesRepository.findMonthlyRevenueBetween(start, end);


    assertEquals(1, list.size());
    Object[] row = list.get(0);
    Integer month = (Integer) row[0];
    BigDecimal actualTotal = (BigDecimal) row[1];
    
    assertEquals(expectedMonth, month);
    assertEquals(0, expectedMonthlyTotal.compareTo(actualTotal));

    }
}
