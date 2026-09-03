package com.ems.loan.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.ems.loan.model.Loan;
import com.ems.loan.model.LoanStatus;
import com.ems.loan.model.PendingDisbursement;

import java.util.List;


@DataJpaTest
public class PendingDisbursementRepositoryTest {

    @Autowired
    private LoanRepository loanRepository;  
    
    @Autowired
    private PendingDisbursementRepository pendingDisbursementRepository;

    private PendingDisbursement createPendingDisbursement(Loan loan){
        PendingDisbursement dis = new PendingDisbursement();
        dis.setLoan(loan);
        dis.setAmount(new BigDecimal("1000"));
        dis.setDisbursedDate(LocalDate.now());
        return dis;
    }

    private Loan createLoan(){
        Loan loan = new Loan();
        loan.setName("Si");
        loan.setFatherName("Dao");
        loan.setAddress("123 Main St");
        loan.setMobileNo("1234567890");
        loan.setJewelryDescription("Gold Ring");
        loan.setLoanAmount(new BigDecimal("1000"));
        loan.setWeight(new BigDecimal("100"));
        loan.setMetal("Gold");
        loan.setStatus(LoanStatus.ACTIVE);
        return loan;
    }

    @Test
    void testFindByLoanId() {
        Loan loan = loanRepository.save(createLoan());
        pendingDisbursementRepository.save(createPendingDisbursement(loan));

        List <PendingDisbursement> result = pendingDisbursementRepository.findByLoanId(loan.getId());
        assertEquals(loan.getId(), result.get(0).getLoan().getId());
        assertEquals(0, new BigDecimal("1000").compareTo(result.get(0).getAmount()));
    }
}
