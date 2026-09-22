package com.ems.purchase.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseResponseDTO {
    private Long id;
    private String supplierName;
    private String supplierPhone;
    private String supplierGstin;
    private String supplierInvoiceNo;
    private LocalDate purchaseDate;
    private Integer itemCount;
    private List<PurchaseItemResponseDTO> items;
}
