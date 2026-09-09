package com.ems.loan.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ems.Exception.Custom_Exception.LoanNotFoundException;
import com.ems.loan.model.InterestPayment;
import com.ems.loan.model.Loan;
import com.ems.loan.model.LoanStatus;
import com.ems.loan.model.PendingDisbursement;
import com.ems.loan.repository.InterestPaymentRepository;
import com.ems.loan.repository.LoanRepository;
import com.ems.loan.repository.PendingDisbursementRepository;

@ExtendWith(MockitoExtension.class)
public class InterestServiceTest {

    @Mock
    private LoanRepository repository;

    @Mock
    private InterestPaymentRepository interestPaymentRepository;

    @Mock
    private PendingDisbursementRepository pendingDisbursementRepository;

    @InjectMocks
    private InterestService interestService;

    @BeforeEach
    void setup() {
    }

    @Test
    void testUnderOneMonth_EnforcesOneMonthMinimumInterest() {
        BigDecimal principal = new BigDecimal("40000");
        BigDecimal rate = new BigDecimal("2.0");
        LocalDate fromDate = LocalDate.of(2026, 8, 12);
        LocalDate toDate = LocalDate.of(2026, 9, 3); // 22 days later

        Map<String, Object> result = interestService.calculateInterestData(principal, rate, fromDate, toDate);

        assertTrue((Boolean) result.get("isMinimumMonthApplied"), "Should flag minimum month applied");
        assertEquals(new BigDecimal("800"), result.get("interestAmount"), "Interest should be 1 full month = 800");
        assertEquals(new BigDecimal("40800"), result.get("totalAmount"), "Total amount should be 40800");
    }

    @Test
    void testUnderOneMonth_CustomRate_EnforcesOneMonthMinimumInterest() {
        BigDecimal principal = new BigDecimal("40000");
        BigDecimal rate = new BigDecimal("1.5");
        LocalDate fromDate = LocalDate.of(2026, 8, 12);
        LocalDate toDate = LocalDate.of(2026, 9, 3); // 22 days later

        Map<String, Object> result = interestService.calculateInterestData(principal, rate, fromDate, toDate);

        assertTrue((Boolean) result.get("isMinimumMonthApplied"), "Should flag minimum month applied");
        assertEquals(new BigDecimal("600"), result.get("interestAmount"), "Interest should be 1 full month at 1.5% = 600");
        assertEquals(new BigDecimal("40600"), result.get("totalAmount"), "Total amount should be 40600");
    }

    @Test
    void testExactlyOneMonth_DoesNotFlagMinimumApplied() {
        BigDecimal principal = new BigDecimal("40000");
        BigDecimal rate = new BigDecimal("2.0");
        LocalDate fromDate = LocalDate.of(2026, 8, 12);
        LocalDate toDate = LocalDate.of(2026, 9, 12); // Exactly 1 month

        Map<String, Object> result = interestService.calculateInterestData(principal, rate, fromDate, toDate);

        assertFalse((Boolean) result.get("isMinimumMonthApplied"), "Should not flag minimum month applied when >= 1 month");
        assertEquals(new BigDecimal("800"), result.get("interestAmount"), "Interest should be 800");
        assertEquals(new BigDecimal("40800"), result.get("totalAmount"), "Total amount should be 40800");
    }

    @Test
    void testOverOneMonth_ChargesProRataDays() {
        BigDecimal principal = new BigDecimal("40000");
        BigDecimal rate = new BigDecimal("2.0");
        LocalDate fromDate = LocalDate.of(2026, 8, 12);
        LocalDate toDate = LocalDate.of(2026, 9, 22); // 1 month and 10 days

        Map<String, Object> result = interestService.calculateInterestData(principal, rate, fromDate, toDate);

        assertFalse((Boolean) result.get("isMinimumMonthApplied"));
        // 40000 * 0.02 * (1 + 10/30) = 800 * 1.3333333333 = 1067
        assertEquals(new BigDecimal("1067"), result.get("interestAmount"));
        assertEquals(new BigDecimal("41067"), result.get("totalAmount"));
    }

    @Test 
    void addDisbursement(){


        Long loanId = 1L;
        BigDecimal amount = new BigDecimal("5000");
        LocalDate date = LocalDate.now();


        Loan loan = Loan.builder()
        .id(1L)
        .name("Test Loan")
        .issueDate(LocalDate.now())
        .status(LoanStatus.ACTIVE)
        .loanAmount(new BigDecimal("90000"))
        .build();

        PendingDisbursement saved = new PendingDisbursement();
        saved.setId(10L);
        saved.setLoan(loan);
        saved.setAmount(amount);
        saved.setDisbursedDate(date);

        when(repository.findByIdForUpdate(loanId)).thenReturn(Optional.of(loan));
        when(interestPaymentRepository.findByLoan_IdOrderByPaymentDateAsc(loanId)).thenReturn(List.of());
        when(pendingDisbursementRepository.save(any(PendingDisbursement.class))).thenReturn(saved);

        PendingDisbursement result = interestService.addDisbursement(loanId, amount, date);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals(amount, result.getAmount());
        assertEquals(date, result.getDisbursedDate());
        assertEquals(loan, result.getLoan());

        verify(repository).findByIdForUpdate(loanId);
        verify(interestPaymentRepository).findByLoan_IdOrderByPaymentDateAsc(loanId);
        verify(pendingDisbursementRepository).save(any(PendingDisbursement.class));
        
    }
    
    @Test
    void testAddDisbursement_ThrowsException_WhenLoanNotFound() {
        when(repository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        assertThrows(LoanNotFoundException.class, 
            () -> interestService.addDisbursement(99L, new BigDecimal("5000"), LocalDate.now()));

        verify(repository).findByIdForUpdate(99L);
        verify(pendingDisbursementRepository, never()).save(any());
    }

    @Test
    void testAddDisbursement_ThrowsException_WhenLoanIsClosed() {
        Loan closedLoan = Loan.builder()
                .id(1L)
                .status(LoanStatus.CLOSED)
                .build();

        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(closedLoan));

        assertThrows(IllegalArgumentException.class, 
            () -> interestService.addDisbursement(1L, new BigDecimal("5000"), LocalDate.now()));

        verify(pendingDisbursementRepository, never()).save(any());
    }

    @Test
    void testAddDisbursement_ThrowsException_WhenAmountIsZeroOrNegative() {
        Loan activeLoan = Loan.builder()
                .id(1L)
                .status(LoanStatus.ACTIVE)
                .build();

        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeLoan));

        assertThrows(IllegalArgumentException.class, 
            () -> interestService.addDisbursement(1L, BigDecimal.ZERO, LocalDate.now()));

        verify(pendingDisbursementRepository, never()).save(any());
    }

    @Test 
    void recordInterestPayment(){
        Long loanId = 1L;
        BigDecimal initialPrincipal = new BigDecimal("40000");
        BigDecimal interestRate = new BigDecimal("2.0");
        LocalDate fromDate = LocalDate.of(2026, 8, 12);
        LocalDate toDate = LocalDate.of(2026, 9, 12); // 1 month -> 800 interest
        BigDecimal amountPaid = new BigDecimal("800");

        Loan activeLoan = Loan.builder()
                .id(loanId)
                .name("John Doe")
                .address("123 Main St")
                .status(LoanStatus.ACTIVE)
                .loanAmount(initialPrincipal)
                .build();

        when(repository.findByIdForUpdate(loanId)).thenReturn(Optional.of(activeLoan));
        when(pendingDisbursementRepository.findByLoanId(loanId)).thenReturn(List.of());
        when(repository.save(any(Loan.class))).thenReturn(activeLoan);
        when(interestPaymentRepository.save(any(InterestPayment.class))).thenAnswer(inv -> inv.getArgument(0));

        InterestPayment payment = interestService.recordInterestPayment(loanId, amountPaid, fromDate, toDate, interestRate);

         assertNotNull(payment);
        assertEquals(amountPaid, payment.getAmountPaid());
        assertEquals(new BigDecimal("40000"), payment.getBalanceAfter());
        assertEquals(toDate, payment.getPaymentDate());
        assertEquals(new BigDecimal("40000"), activeLoan.getLoanAmount());
    
        
        verify(repository).findByIdForUpdate(loanId);
        verify(repository).save(activeLoan);
        verify(pendingDisbursementRepository).deleteAll(any());
        verify(interestPaymentRepository).save(any(InterestPayment.class));
    }

     @Test
    void testRecordInterestPayment_ThrowsException_WhenLoanClosed() {
        Loan closedLoan = Loan.builder()
                .id(1L)
                .status(LoanStatus.CLOSED)
                .build();
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(closedLoan));
        assertThrows(RuntimeException.class, 
            () -> interestService.recordInterestPayment(1L, new BigDecimal("800"), 
                    LocalDate.now().minusMonths(1), LocalDate.now(), new BigDecimal("2.0")));
        verify(interestPaymentRepository, never()).save(any());
    }

     @Test
    void testRecordInterestPayment_WithPendingDisbursement() {
        Long loanId = 1L;
        BigDecimal principal = new BigDecimal("40000");
        BigDecimal disbursement = new BigDecimal("10000");
        BigDecimal rate = new BigDecimal("2.0");
        LocalDate fromDate = LocalDate.now().minusMonths(1);
        LocalDate toDate = LocalDate.now();
        BigDecimal amountPaid = new BigDecimal("1000"); // 800 interest on principal + 200 on disbursement

        Loan activeLoan = Loan.builder()
                .id(loanId)
                .name("John Doe")
                .address("123 Main St")
                .status(LoanStatus.ACTIVE)
                .loanAmount(principal)
                .build();

        PendingDisbursement pending = new PendingDisbursement();
        pending.setId(5L);
        pending.setLoan(activeLoan);
        pending.setAmount(disbursement);
        pending.setDisbursedDate(fromDate);

        when(repository.findByIdForUpdate(loanId)).thenReturn(Optional.of(activeLoan));
        when(pendingDisbursementRepository.findByLoanId(loanId)).thenReturn(List.of(pending));
        when(repository.save(any(Loan.class))).thenReturn(activeLoan);
        when(interestPaymentRepository.save(any(InterestPayment.class))).thenAnswer(inv -> inv.getArgument(0));

        InterestPayment payment = interestService.recordInterestPayment(loanId, amountPaid, fromDate, toDate, rate);

        assertNotNull(payment);
        // Principal + Disbursement = 50000. Interest = 800 + 200 = 1000. New Balance = 50000.
        // After payment of 1000: 49000
        assertEquals(amountPaid, payment.getAmountPaid());
        assertEquals(new BigDecimal("50000"), payment.getBalanceAfter());
        assertEquals(toDate, payment.getPaymentDate());
        assertEquals(new BigDecimal("50000"), activeLoan.getLoanAmount());

        verify(repository).findByIdForUpdate(loanId);
        verify(repository).save(activeLoan);
        verify(pendingDisbursementRepository).deleteAll(any());
        verify(interestPaymentRepository).save(any(InterestPayment.class));
    }

}




