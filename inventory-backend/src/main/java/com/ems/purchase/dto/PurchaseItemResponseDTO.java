package com.ems.purchase.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseItemResponseDTO {
    private Long id;
    private Long purchaseId;
    private String sku;
    private String productName;
    private String material;
    private String purity;
    private Integer quantity;
    private BigDecimal weight;
    private BigDecimal costPerGram;
    private BigDecimal lineTotal;
    private String hsnCode;
}
