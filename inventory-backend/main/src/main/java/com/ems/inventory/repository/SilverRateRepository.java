package com.ems.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ems.inventory.model.Silver;


public interface  SilverRateRepository extends JpaRepository<Silver, Long>{
    @Query (value = "SELECT * FROM Silver ORDER BY timestamp DESC LIMIT 1", nativeQuery=true)
    Silver getLatestsilver();

}
