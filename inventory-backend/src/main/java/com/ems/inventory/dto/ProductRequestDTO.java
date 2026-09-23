package com.ems.inventory.dto;



import java.math.BigDecimal;

import lombok.Data;

@Data
public class ProductRequestDTO {


    private String name;

    private String sku;

    private String mainCategory;

    private String subCategory;

    private String material;

    private Integer stockQuantity;

    private BigDecimal totalWeight;

    private String purity;

    public BigDecimal getBaseWeight() {
        return totalWeight;
    }

    public void setBaseWeight(BigDecimal baseWeight) {
        this.totalWeight = baseWeight;
    }
}
