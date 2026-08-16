package com.ems.custom_order.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;
import com.ems.custom_order.model.CustomOrder;

@Repository
public interface CustomOrderRepository extends JpaRepository<CustomOrder, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM CustomOrder c WHERE c.orderId = :orderId")
    Optional<CustomOrder> findByIdForUpdate(@Param("orderId") Long orderId); 
}       