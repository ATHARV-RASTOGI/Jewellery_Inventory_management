package com.ems.inventory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.loan.model.InterestPayment;

public interface InterestPaymentRepository extends JpaRepository<InterestPayment, Long> {
    List<InterestPayment> findByLoanIdOrderByPaymentDateAsc(Long loanId);
}