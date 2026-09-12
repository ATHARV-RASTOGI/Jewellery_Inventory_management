package com.ems.gst.service;

import java.util.List;
import org.springframework.stereotype.Service;
import com.ems.gst.model.HsnMaster;
import com.ems.gst.repository.HsnMasterRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HsnMasterService {

    private final HsnMasterRepository hsnMasterRepository;

    public List<HsnMaster> getAllHsn() {
        return hsnMasterRepository.findAll();
    }

    public HsnMaster updateHsn(Long id, HsnMaster updated) {
        HsnMaster existing = hsnMasterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("HSN entry not found with id: " + id));
        existing.setHsnCode(updated.getHsnCode());
        existing.setDescription(updated.getDescription());
        existing.setGstRate(updated.getGstRate());
        return hsnMasterRepository.save(existing);
    }
}
