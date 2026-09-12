package com.ems.component;

import java.math.BigDecimal;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.ems.gst.model.HsnMaster;
import com.ems.gst.repository.HsnMasterRepository;

import lombok.RequiredArgsConstructor;

@Component 
@RequiredArgsConstructor 
public class HsnInitializer implements CommandLineRunner{

    private final HsnMasterRepository hsnRepo;


    @Override
    public void run(String... args) throws Exception{

        if(hsnRepo.count() == 0 ){
            hsnRepo.save(HsnMaster.builder().materialKey("GOLD").hsnCode("7113").description("Gold").gstRate(new BigDecimal("3.0")).build());
            hsnRepo.save(HsnMaster.builder().materialKey("SILVER").hsnCode("7114").description("Silver").gstRate(new BigDecimal("3.0")).build());
        }
    }

    
}
