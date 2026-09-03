package com.ems.custom_order.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.ems.custom_order.model.CustomOrder;
import com.ems.custom_order.model.OrderStatus;

@DataJpaTest
public class CustomOrderRepositoryTest {

    @Autowired
    private CustomOrderRepository customOrderRepository;
    
    private CustomOrder createCustomOrder(){
        return CustomOrder.builder()
            .customerAddress("Customer Address")
            .customerName("Customer Name")
            .customerPhone("Customer Phone")
            .designRemark("Design Remark")
            .advanceAmount(new BigDecimal("1000"))
            .status(OrderStatus.PENDING)
            .build();
    }

    @Test
    void testFindByIdForUpdate() {

        CustomOrder order = customOrderRepository.save(createCustomOrder());
        Optional<CustomOrder> orderls = customOrderRepository.findByIdForUpdate(order.getOrderId());

        assertTrue(orderls.isPresent());
        assertEquals(order.getCustomerPhone(), orderls.get().getCustomerPhone());
    }
}
