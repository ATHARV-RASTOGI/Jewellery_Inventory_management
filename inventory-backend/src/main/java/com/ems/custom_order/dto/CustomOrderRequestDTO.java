package com.ems.custom_order.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.ems.custom_order.model.OrderStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class CustomOrderRequestDTO {


    @NotBlank(message = "Customer name is required ")
    private String customerName;

    @Pattern(regexp = "^[0-9]{10}$",message = "Phone number must be 10 digits")
    private String customerPhone;

    private String customerAddress;

    @NotBlank(message = "Item name is required")
    private String itemName;

    private String materialType;
    private String goldCarat;
    private String daimondCarat;
    private String deesignRemark;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate orderDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate pickupDate;

    @PositiveOrZero(message = "Advance amount cannot be negative")
    private BigDecimal advanceAmount;

    @PositiveOrZero(message = "Total amount cannot be negative")
    private BigDecimal totalAmount;

    private OrderStatus status;
    
    private String linkedSaleId;


    
}