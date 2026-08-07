package com.ems.loan.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.ems.loan.model.Loan;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long>{

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM Loan l WHERE l.id = :id")
    Optional<Loan> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    
     @Query("SELECT COALESCE(SUM(l.loanAmount), 0.0) FROM Loan l")
    Double getTotalLoanAmount();

    @Query("SELECT COUNT(l) FROM Loan l WHERE LOWER(l.status) = 'active'")
    long countActiveLoans();
}

