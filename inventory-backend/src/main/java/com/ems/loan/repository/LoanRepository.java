package com.ems.loan.repository;

import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ems.loan.model.Loan;

import jakarta.persistence.LockModeType;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM Loan l WHERE l.id = :id")
    Optional<Loan> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(l.loanAmount), 0) FROM Loan l")
    BigDecimal getTotalLoanAmount();

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.status = com.ems.loan.model.LoanStatus.ACTIVE")
    long countActiveLoans();

    Optional<Loan> findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseOrderByIdDesc(String name, String fatherName);

    Optional<Loan> findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseAndAddressIgnoreCaseOrderByIdDesc(String name, String fatherName, String address);

   
}