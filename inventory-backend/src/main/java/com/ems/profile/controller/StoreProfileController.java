package com.ems.profile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.profile.model.StoreProfile;
import com.ems.profile.service.StoreProfileService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/store-profile")
@RequiredArgsConstructor
public class StoreProfileController {

    private final StoreProfileService storeProfileService;

    @GetMapping
    public ResponseEntity<StoreProfile> getProfile() {
        return ResponseEntity.ok(storeProfileService.getProfile());
    }

    @PutMapping
    public ResponseEntity<StoreProfile> updateProfile(@RequestBody StoreProfile profile) {
        return ResponseEntity.ok(storeProfileService.updateProfile(profile));
    }
}
