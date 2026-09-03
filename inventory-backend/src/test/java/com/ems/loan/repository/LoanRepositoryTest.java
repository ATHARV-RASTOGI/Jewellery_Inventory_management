package com.ems.loan.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.ems.loan.model.Loan;
import com.ems.loan.model.LoanStatus;

@DataJpaTest
public class LoanRepositoryTest {


    @Autowired
    private LoanRepository loanRepository ;

    private Loan createLoan(String name ,String fatherName , String address , String mobileNo , String jewelryDescription , BigDecimal loanAmount , BigDecimal weight , String metal , LoanStatus status ){
       return Loan.builder()
            .name(name)
            .fatherName(fatherName)
            .address(address)
            .mobileNo(mobileNo)
            .jewelryDescription(jewelryDescription)
            .loanAmount(loanAmount)
            .weight(weight)
            .metal(metal)
            .status(status)
            .build();
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
        Loan savedLoan = loanRepository.save(createLoan("Ad", "Fd", "Addr2", "7897832312", "Jewelry Description", new BigDecimal("1000"), new BigDecimal("100"), "Gold", LoanStatus.CLOSED));
      
        Optional<Loan> loan = loanRepository.findByIdForUpdate(savedLoan.getId());
        assertTrue(loan.isPresent());
        assertEquals(savedLoan.getId(), loan.get().getId());
        assertEquals(savedLoan.getName(), loan.get().getName());
        assertEquals(savedLoan.getFatherName(), loan.get().getFatherName());
        assertEquals(savedLoan.getAddress(), loan.get().getAddress());
        assertEquals(savedLoan.getMobileNo(), loan.get().getMobileNo());
        assertEquals(savedLoan.getJewelryDescription(), loan.get().getJewelryDescription());
        assertEquals(savedLoan.getLoanAmount(), loan.get().getLoanAmount());
        assertEquals(savedLoan.getWeight(), loan.get().getWeight());
        assertEquals(savedLoan.getMetal(), loan.get().getMetal());
        assertEquals(savedLoan.getStatus(), loan.get().getStatus());
    }

    @Test
    void testFindFirstByNameIgnoreCaseAndFatherNameIgnoreCaseAndAddressIgnoreCaseOrderByIdDesc() {
         loanRepository.save(createLoan("A", "F", "Addr1", "1234567890", "Jewelry Description", new BigDecimal("1000"), new BigDecimal("100"), "Gold", LoanStatus.ACTIVE));
    
   
    Loan latestLoan = loanRepository.save(createLoan("a", "f", "addr1", "1234567890", "Jewelry Description", new BigDecimal("1000"), new BigDecimal("100"), "Gold", LoanStatus.CLOSED));
  
    Optional<Loan> loan = loanRepository.findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseAndAddressIgnoreCaseOrderByIdDesc("A", "F", "Addr1");
    
    assertTrue(loan.isPresent());
    
    assertEquals(latestLoan.getId(), loan.get().getId()); 
    
    assertEquals(latestLoan.getStatus(), loan.get().getStatus()); 
    }

    @Test
    void testFindFirstByNameIgnoreCaseAndFatherNameIgnoreCaseOrderByIdDesc() {
          loanRepository.save(createLoan("A", "F", "Addr1", "1234567890", "Jewelry Description", new BigDecimal("1000"), new BigDecimal("100"), "Gold", LoanStatus.ACTIVE));
    
  
        Loan saved = loanRepository.save(createLoan("a", "f", "addr1", "1234567890", "Jewelry Description", new BigDecimal("1000"), new BigDecimal("100"), "Gold", LoanStatus.CLOSED));
        
        Optional<Loan> loan = loanRepository.findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseOrderByIdDesc("A", "F");
        
        assertTrue(loan.isPresent());
        
        assertEquals(saved.getId(), loan.get().getId());
        
        assertEquals(saved.getFatherName(), loan.get().getFatherName());
        assertEquals(saved.getName(), loan.get().getName());
    }

    @Test
    void testGetTotalLoanAmount() {
        loanRepository.save(createLoan("Ad", "Fd", "Addr2", "7897832312", "Jewelry Description", new BigDecimal("1000"), new BigDecimal("100"), "Gold", LoanStatus.CLOSED));
 
        loanRepository.save(createLoan("Azz", "FAD", "Addr1", "1234567890", "Jewelry Description", new BigDecimal("1000"), new BigDecimal("100"), "Gold", LoanStatus.ACTIVE));


        BigDecimal totalLoanAmount = loanRepository.getTotalLoanAmount();
        assertEquals(0, new BigDecimal("2000.00").compareTo(totalLoanAmount));
    }
}
