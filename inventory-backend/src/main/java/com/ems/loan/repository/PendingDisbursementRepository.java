package com.ems.loan.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ems.loan.model.PendingDisbursement;

@Repository
public interface PendingDisbursementRepository extends JpaRepository<PendingDisbursement, Long> {
    List<PendingDisbursement> findByLoanId(Long loanId);
}