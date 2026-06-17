package com.ems.inventory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.inventory.model.Sales;

public interface SalesRepository extends JpaRepository<Sales, Object> {
    
     List<Sales> findAllByOrderBySaleDateDesc();
}

