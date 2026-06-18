package com.ems.sales.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.sales.model.Sales;

public interface SalesRepository extends JpaRepository<Sales, Object> {
    
     List<Sales> findAllByOrderBySaleDateDesc();
}

