package com.ems.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Data;

@Data
public class BatchResponseDTO {
    private Long id;
    private String batchNumber;
    private LocalDate batchDate;
    private Integer quantity;
    private BigDecimal weightAdded;
    private ProductResponseDTO product;
}
