package com.ems.Exportdata.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ems.Exportdata.dto.ExportCriteria;
import com.ems.inventory.model.Product;
import com.ems.inventory.repository.ProductRepository;
import com.ems.loan.model.InterestPayment;
import com.ems.loan.model.Loan;
import com.ems.loan.model.LoanStatus;
import com.ems.loan.repository.InterestPaymentRepository;
import com.ems.loan.repository.LoanRepository;
import com.ems.sales.model.Saleitem;
import com.ems.sales.model.Sales;
import com.ems.sales.repository.SaleItemRepository;
import com.ems.sales.repository.SalesRepository;

@ExtendWith(MockitoExtension.class)
public class ExportServiceTest {

    @Mock
    private LoanRepository loanRepo;

    @Mock
    private InterestPaymentRepository interestPaymentRepo;

    @Mock
    private SalesRepository salesRepo;

    @Mock
    private SaleItemRepository saleItemRepo;

    @Mock
    private ProductRepository proRepo;

    @InjectMocks
    private ExportService exportService;

    @Test
    void testExportToExcel_AllSheets() throws IOException {
        Loan loan = Loan.builder()
                .id(1L)
                .name("Ramesh")
                .fatherName("Suresh")
                .mobileNo("9876543210")
                .address("Varanasi")
                .jewelryDescription("Gold Necklace")
                .metal("Gold")
                .weight(new BigDecimal("15.5"))
                .loanAmount(new BigDecimal("50000.00"))
                .issueDate(LocalDate.now().minusDays(10))
                .status(LoanStatus.ACTIVE)
                .build();

        InterestPayment payment = new InterestPayment();
        payment.setId(1L);
        payment.setCustomer_name("Ramesh");
        payment.setAmountPaid(new BigDecimal("1500.00"));
        payment.setPaymentDate(LocalDate.now());

        Product goldProduct = Product.builder()
                .id(1L)
                .name("Gold Ring")
                .sku("SKU-GOLD-01")
                .material("Gold")
                .purity("22K")
                .baseWeight(new BigDecimal("5.0"))
                .stockQuantity(10)
                .build();

        Product silverProduct = Product.builder()
                .id(2L)
                .name("Silver Coin")
                .sku("SKU-SILV-01")
                .material("Silver")
                .purity("999")
                .baseWeight(new BigDecimal("10.0"))
                .stockQuantity(25)
                .build();

        Sales sale = Sales.builder()
                .id(1L)
                .customerName("Anita")
                .customerPhoneNo("9876543211")
                .customerAddress("Lucknow")
                .subtotal(new BigDecimal("20000.00"))
                .gstAmount(new BigDecimal("600.00"))
                .grandTotal(new BigDecimal("20600.00"))
                .saleDate(LocalDate.now())
                .build();

        Saleitem item = Saleitem.builder()
                .id(1L)
                .sku("SKU-GOLD-01")
                .productName("Gold Ring")
                .material("Gold")
                .purity("22K")
                .quantity(1)
                .lineTotal(new BigDecimal("20000.00"))
                .build();

        when(loanRepo.findAll()).thenReturn(List.of(loan));
        when(interestPaymentRepo.findAll()).thenReturn(List.of(payment));
        when(proRepo.findAll()).thenReturn(List.of(goldProduct, silverProduct));
        when(salesRepo.findAllByOrderBySaleDateDesc()).thenReturn(List.of(sale));
        when(saleItemRepo.findAll()).thenReturn(List.of(item));

        byte[] result = exportService.exportToExcel(new ExportCriteria());

        assertNotNull(result);
        assertTrue(result.length > 0, "Exported Excel byte array should not be empty");
    }

    @Test
    void testExportToExcel_OnlyInventory() throws IOException {
        Product product = Product.builder()
                .id(1L)
                .name("Silver Chain")
                .sku("SKU-SILV-02")
                .material("Silver")
                .stockQuantity(5)
                .build();

        when(proRepo.findAll()).thenReturn(List.of(product));

        ExportCriteria criteria = new ExportCriteria(false, true, false, false, false, false);
        byte[] result = exportService.exportToExcel(criteria);

        assertNotNull(result);
        assertTrue(result.length > 0);
    }
}
