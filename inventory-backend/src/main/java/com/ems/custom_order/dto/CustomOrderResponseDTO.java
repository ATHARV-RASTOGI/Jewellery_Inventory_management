package com.ems.custom_order.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.ems.custom_order.model.OrderStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class CustomOrderResponseDTO {

    private Long orderId;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private String itemName;
    private String materialType;
    private String goldCarat;
    private String diamondCarat;
    private String designRemark;


    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate orderDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate pickupDate;

    private BigDecimal advanceAmount;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private String linkedSaleId;

    public BigDecimal getBalanceDue() {
        if(totalAmount == null )return BigDecimal.ZERO;
        BigDecimal advance = advanceAmount != null ? advanceAmount : BigDecimal.ZERO;
        return totalAmount.subtract(advance);
    }

}
