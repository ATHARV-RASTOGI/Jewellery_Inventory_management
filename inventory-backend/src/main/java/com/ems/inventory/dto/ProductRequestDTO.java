package com.ems.inventory.dto;



import java.math.BigDecimal;

import jakarta.persistence.Column;
import lombok.Data;

@Data
public class ProductRequestDTO {


    private String name;

    private String sku;

    private String mainCategory;

    private String subCategory;

    private String material;

    private Integer stockQuantity;

    @Column(precision = 10 , scale = 3)
    private BigDecimal baseWeight;

    private String purity;



}
