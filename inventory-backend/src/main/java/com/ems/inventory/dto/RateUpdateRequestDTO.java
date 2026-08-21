package com.ems.inventory.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class RateUpdateRequestDTO {
    private BigDecimal rate;
}
