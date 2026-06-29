package com.ems.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ems.inventory.model.Goldrates;

public interface GoldRateRepository extends JpaRepository<Goldrates, Long> {
    
    @Query(value = "SELECT * FROM goldrates ORDER BY timestamp DESC LIMIT 1", nativeQuery = true)
    Goldrates getLatestGoldRate();
}