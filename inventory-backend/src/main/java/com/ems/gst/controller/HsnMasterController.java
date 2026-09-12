package com.ems.gst.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ems.gst.model.HsnMaster;
import com.ems.gst.service.HsnMasterService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/hsn")
@RequiredArgsConstructor
public class HsnMasterController {

    private final HsnMasterService hsnMasterService;

    @GetMapping
    public ResponseEntity<List<HsnMaster>> getAllHsn() {
        return ResponseEntity.ok(hsnMasterService.getAllHsn());
    }

    @PutMapping("/{id}")
    public ResponseEntity<HsnMaster> updateHsn(@PathVariable Long id, @RequestBody HsnMaster updated) {
        return ResponseEntity.ok(hsnMasterService.updateHsn(id, updated));
    }
}
