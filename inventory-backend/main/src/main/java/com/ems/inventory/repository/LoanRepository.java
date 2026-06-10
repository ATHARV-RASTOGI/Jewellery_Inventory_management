package com.ems.inventory.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.ems.inventory.model.Loan;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long>{
     @Query("SELECT COALESCE(SUM(l.amountGiven), 0.0) FROM Loan l")
    Double getTotalLoanAmount();
}
