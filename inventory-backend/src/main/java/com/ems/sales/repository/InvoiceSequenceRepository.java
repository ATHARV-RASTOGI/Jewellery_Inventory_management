package com.ems.sales.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.sales.model.InvoiceSequence;

import jakarta.persistence.LockModeType;

public interface InvoiceSequenceRepository extends JpaRepository<InvoiceSequence, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM InvoiceSequence s WHERE s.financialYear = :fy")
    Optional<InvoiceSequence> findByFinancialYearForUpdate(@Param("fy") String fy);
}
