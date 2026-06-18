package com.ems.sales.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.sales.model.Saleitem;

public interface SaleItemRepository extends JpaRepository<Saleitem, Long> {
    // Query via the relationship, not a plain column
    List<Saleitem> findBySale_IdOrderById(Long saleId);
}