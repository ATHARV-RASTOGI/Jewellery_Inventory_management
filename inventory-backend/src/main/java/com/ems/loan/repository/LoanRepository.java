package com.ems.loan.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ems.loan.model.Loan;

public interface LoanRepository extends JpaRepository<Loan, Long>{
     @Query("SELECT COALESCE(SUM(l.loanAmount), 0.0) FROM Loan l")
    Double getTotalLoanAmount();

    @Query("SELECT COUNT(l) FROM Loan l WHERE LOWER(l.status) = 'active'")
    long countActiveLoans();
}

