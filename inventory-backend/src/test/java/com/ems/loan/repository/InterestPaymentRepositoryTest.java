package com.ems.loan.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.ems.loan.model.InterestPayment;
import com.ems.loan.model.Loan;
import com.ems.loan.model.LoanStatus;


@DataJpaTest
public class InterestPaymentRepositoryTest {

    @Autowired
    private InterestPaymentRepository interestPaymentRepository;

    @Autowired
    private LoanRepository loanRepository;  

    private Loan createLoan() {
        Loan loan = new Loan();
        loan.setName("John");
        loan.setFatherName("Doe");
        loan.setAddress("123 Main St");
        loan.setMobileNo("1234567890");
        loan.setJewelryDescription("Gold Ring");
        loan.setLoanAmount(new BigDecimal("1000"));
        loan.setWeight(new BigDecimal("100"));
        loan.setMetal("Gold");
        loan.setStatus(LoanStatus.ACTIVE);
        return loan;
    }

    private InterestPayment createPayment(Loan loan) {
        InterestPayment payment = new InterestPayment();
        payment.setLoan(loan);
        payment.setPaymentDate(LocalDate.now());
        payment.setAmountPaid(new BigDecimal("1000"));
        payment.setBalanceAfter(new BigDecimal("1000"));
        payment.setCustomer_name("John");
        payment.setAddress("123 Main St");
        return payment;
    }

    @Test
    void testFindByLoanId() {
        Loan savedLoan = loanRepository.save(createLoan());   
        interestPaymentRepository.save(createPayment(savedLoan));

        List<InterestPayment> payment = interestPaymentRepository.findByLoan_IdOrderByPaymentDateAsc(savedLoan.getId());

        assertEquals(1, payment.size());
        assertEquals(savedLoan.getId(), payment.get(0).getLoan().getId());
        assertEquals(payment.get(0).getLoan(), savedLoan);
        
    }
}
