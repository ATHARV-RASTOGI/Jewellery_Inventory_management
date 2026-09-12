package com.ems.profile.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.profile.model.StoreProfile;
import com.ems.profile.repository.StoreProfileRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StoreProfileService {

    private final StoreProfileRepository storeProfileRepository;

    public StoreProfile getProfile() {
        return storeProfileRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> storeProfileRepository.save(StoreProfile.builder()
                        .shopName("SWARNA MAHAL JEWELLERS")
                        .address("123, Sarafa Bazar, Main Road, City (U.P.)")
                        .gstin("09AAAAA0000A1Z5")
                        .stateCode("09 (U.P.)")
                        .phone("+91 98765 43210")
                        .jurisdictionCourt("City Court")
                        .build()));
    }

    @Transactional
    public StoreProfile updateProfile(StoreProfile updated) {
        StoreProfile existing = getProfile();
        existing.setShopName(updated.getShopName());
        existing.setAddress(updated.getAddress());
        existing.setGstin(updated.getGstin());
        existing.setStateCode(updated.getStateCode());
        existing.setPhone(updated.getPhone());
        existing.setJurisdictionCourt(updated.getJurisdictionCourt());
        return storeProfileRepository.save(existing);
    }
}
