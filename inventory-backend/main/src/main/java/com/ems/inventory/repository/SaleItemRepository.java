package com.ems.inventory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.inventory.model.Saleitem;

public interface SaleItemRepository extends JpaRepository<Saleitem, Long> {
    // Query via the relationship, not a plain column
    List<Saleitem> findBySale_IdOrderById(Long saleId);
}