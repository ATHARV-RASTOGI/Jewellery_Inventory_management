
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
    private BigDecimal baseWeight;
    private String purity;
    private Integer stockQuantity; // fixed spelling
}
