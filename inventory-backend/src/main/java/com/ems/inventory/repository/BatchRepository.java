package com.ems.inventory.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.inventory.model.Batch;

public interface BatchRepository extends JpaRepository<Batch,Long>{
    
    Optional<Batch> findByProductIdOrderByBatchDateDesc(Long productId);
}
