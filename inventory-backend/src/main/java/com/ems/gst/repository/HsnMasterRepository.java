package com.ems.gst.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.gst.model.HsnMaster;

public interface HsnMasterRepository extends JpaRepository<HsnMaster, Long> {

    public Optional<HsnMaster> findByMaterialKeyIgnoreCase(String materialKey);
    
}
