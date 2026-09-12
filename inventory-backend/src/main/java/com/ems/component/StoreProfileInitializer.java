package com.ems.component;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.ems.profile.model.StoreProfile;
import com.ems.profile.repository.StoreProfileRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class StoreProfileInitializer implements CommandLineRunner {

    private final StoreProfileRepository storeProfileRepository;

    @Override
    public void run(String... args) throws Exception {
        if (storeProfileRepository.count() == 0) {
            storeProfileRepository.save(StoreProfile.builder()
                    .shopName("SWARNA MAHAL JEWELLERS")
                    .address("123, Sarafa Bazar, Main Road, City (U.P.)")
                    .gstin("09AAAAA0000A1Z5")
                    .stateCode("09 (U.P.)")
                    .phone("+91 98765 43210")
                    .jurisdictionCourt("City Court")
                    .build());
        }
    }
}
