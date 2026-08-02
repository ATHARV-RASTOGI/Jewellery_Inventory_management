package com.ems.custom_order.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.ems.custom_order.model.CustomOrder;

@Repository
public interface CustomOrderRepository extends JpaRepository<CustomOrder, Long> { 
}