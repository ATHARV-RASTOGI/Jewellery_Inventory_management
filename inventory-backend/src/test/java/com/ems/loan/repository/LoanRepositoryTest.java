package com.ems.loan.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.validateMockitoUsage;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.AutoClose;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.ems.loan.model.Loan;
import com.ems.loan.model.LoanStatus;

@DataJpaTest
public class LoanRepositoryTest {


    @Autowired
    private LoanRepository loanRepository ;
    private Loan loan;
    private LoanStatus loanstatus;

    @BeforeEach
    void setup() {
        loan = Loan.builder()
                        .id(1L)
                        .status(LoanStatus.ACTIVE)
                        .build();
    }

    private Loan createLoan(String name ,String fatherName , String address , String mobileNo , String jewelryDescription , BigDecimal loanAmount , BigDecimal weight , String metal , LoanStatus status ){
        Loan loan = new Loan();
        loan.setName(name);
        loan.setFatherName(fatherName);
        loan.setAddress(address);
        loan.setMobileNo(mobileNo);
        loan.setJewelryDescription(jewelryDescription);
        loan.setLoanAmount(loanAmount);
        loan.setWeight(weight);
        loan.setMetal(metal);
        loan.setStatus(status);
        return loan;
    }

    @Test
    void testCountActiveLoans() {
        loanRepository.save(createLoan("Ad", "Fd", "Addr2", "7897832312", "Jewelry Description", new BigDecimal("1000"), new BigDecimal("100"), "Gold", LoanStatus.CLOSED));
 
        loanRepository.save(createLoan("A", "FA", "Addr1", "1234567890", "Jewelry Description", new BigDecimal("1000"), new BigDecimal("100"), "Gold", LoanStatus.ACTIVE));
        long count = loanRepository.countActiveLoans();
        assertEquals(1, count);
       
    }

    @Test
    void testFindByIdForUpdate() {
        loanRepository.findByIdForUpdate(loan.getId());
        
    }

    @Test
    void testFindFirstByNameIgnoreCaseAndFatherNameIgnoreCaseAndAddressIgnoreCaseOrderByIdDesc() {

    }

    @Test
    void testFindFirstByNameIgnoreCaseAndFatherNameIgnoreCaseOrderByIdDesc() {

    }

    @Test
    void testGetTotalLoanAmount() {

    }
}
