package com.ems.sales.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.sales.model.Sales;

public interface SalesRepository extends JpaRepository<Sales, Long> {

     List<Sales> findAllByOrderBySaleDateDesc();

     Page<Sales> findAllByOrderBySaleDateDesc(Pageable pageable);

     @Query("SELECT MONTH(s.saleDate), SUM(s.grandTotal) FROM Sales s WHERE s.saleDate BETWEEN :start AND :end GROUP BY MONTH(s.saleDate) ORDER BY MONTH(s.saleDate)")
     List<Object[]> findMonthlyRevenueBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

     @Query("SELECT s.saleDate, SUM(s.grandTotal) FROM Sales s WHERE s.saleDate BETWEEN :start AND :end GROUP BY s.saleDate ORDER BY s.saleDate")
     List<Object[]> findDailyRevenueBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}

