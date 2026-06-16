package com.ems.inventory.repository;

import com.ems.inventory.model.InterestPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InterestPaymentRepository extends JpaRepository<InterestPayment, Long> {
    List<InterestPayment> findByLoanIdOrderByPaymentDateAsc(Long loanId);
}