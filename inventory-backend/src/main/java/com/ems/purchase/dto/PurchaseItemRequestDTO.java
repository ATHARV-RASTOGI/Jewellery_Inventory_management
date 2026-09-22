package com.ems.purchase.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class PurchaseItemRequestDTO {
    private String sku;
    private Integer quantity;
    private BigDecimal weight;
    private BigDecimal costPerGram;
    private BigDecimal lineTotal;
}
