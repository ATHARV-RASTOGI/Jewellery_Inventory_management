
package com.ems.inventory.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class ProductResponseDTO {
    private Long id;
    private String name;
    private String sku;
    private String mainCategory;
    private String subCategory;
    private String material;
    private BigDecimal totalWeight;
    private String purity;
    private Integer stockQuantity; // fixed spelling

    public BigDecimal getBaseWeight() {
        return totalWeight;
    }

    public void setBaseWeight(BigDecimal baseWeight) {
        this.totalWeight = baseWeight;
    }
}
