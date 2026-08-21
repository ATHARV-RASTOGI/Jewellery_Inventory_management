package com.ems.config;


import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.ems.sales.dto.SalesResponseDTO;
import com.ems.sales.model.Sales;

@Configuration
public class ModelMapperConfig {
    
    @Bean
    public ModelMapper modelMapper(){
        ModelMapper modelMapper = new ModelMapper();

        modelMapper.getConfiguration()
            .setMatchingStrategy(MatchingStrategies.STANDARD)
            .setSkipNullEnabled(true);

        modelMapper.typeMap(Sales.class, SalesResponseDTO.class)
            .addMappings(mapper -> mapper.skip(SalesResponseDTO::setItems));
        
        return modelMapper;
    }
}
