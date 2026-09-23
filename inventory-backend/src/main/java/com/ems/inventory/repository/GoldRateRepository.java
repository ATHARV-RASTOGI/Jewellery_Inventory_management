package com.ems.inventory.repository;



import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.inventory.model.Goldrates;

public interface GoldRateRepository extends JpaRepository<Goldrates, Long> {
    
    Optional<Goldrates> findFirstByOrderByTimestampDescIdDesc();

   
}