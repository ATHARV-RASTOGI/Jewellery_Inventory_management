package com.ems.sales.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.sales.model.Saleitem;

public interface SaleItemRepository extends JpaRepository<Saleitem, Long> {
    // Query via the relationship, not a plain column
    List<Saleitem> findBySale_IdOrderById(Long saleId);

    long countBySale_Id(Long saleId);

    @Query("SELECT COALESCE(i.material,'Other'), SUM(i.lineTotal) FROM Saleitem i WHERE i.sale.saleDate BETWEEN :start AND :end GROUP BY COALESCE(i.material,'Other')")
    List<Object[]> findMaterialTotalsBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}