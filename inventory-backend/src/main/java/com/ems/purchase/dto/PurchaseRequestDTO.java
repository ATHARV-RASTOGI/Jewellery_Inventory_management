package com.ems.purchase.dto;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

@Data
public class PurchaseRequestDTO {
    private String supplierName;
    private String supplierPhone;
    private String supplierGstin;
    private String supplierInvoiceNo;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate purchaseDate;

    private List<PurchaseItemRequestDTO> items;
}
