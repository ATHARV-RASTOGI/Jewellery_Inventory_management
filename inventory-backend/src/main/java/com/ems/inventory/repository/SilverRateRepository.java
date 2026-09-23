package com.ems.inventory.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.ems.inventory.model.Silver;


public interface  SilverRateRepository extends JpaRepository<Silver, Long>{
    Optional<Silver> findFirstByOrderByTimestampDescIdDesc();


}
