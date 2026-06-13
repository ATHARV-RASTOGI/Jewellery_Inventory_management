package com.ems.inventory.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ems.inventory.model.Loan;

public interface LoanRepository extends JpaRepository<Loan, Long>{
     @Query("SELECT COALESCE(SUM(l.loanAmount), 0.0) FROM Loan l")
    Double getTotalLoanAmount();
}
