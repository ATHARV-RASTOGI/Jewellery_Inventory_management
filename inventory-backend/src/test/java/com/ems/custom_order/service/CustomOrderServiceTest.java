package com.ems.custom_order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import com.ems.custom_order.dto.CustomOrderResponseDTO;
import com.ems.custom_order.model.CustomOrder;
import com.ems.custom_order.repository.CustomOrderRepository;


@ExtendWith(MockitoExtension.class)
public class CustomOrderServiceTest {

    @Mock
    private CustomOrderRepository customOrderRepository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private CustomOrderService customOrderService;
   
    @Test
    void testDeleteCustomOrder() {

    }

    @Test
    void testGetAllCustomOrder() {
       CustomOrder order = new CustomOrder();
        order.setOrderId(1L);
        order.setCustomerName("John Doe");

        CustomOrderResponseDTO dto = new CustomOrderResponseDTO();
        dto.setOrderId(1L);
        dto.setCustomerName("John Doe");

        when(customOrderRepository.findAll()).thenReturn(Collections.singletonList(order));
        when(modelMapper.map(order, CustomOrderResponseDTO.class)).thenReturn(dto);

        List<CustomOrderResponseDTO> result = customOrderService.getAllCustomOrder();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(Long.valueOf(1), result.get(0).getOrderId());

        verify(customOrderRepository).findAll();

    }

    @Test
    void testGetCustomOrderById() {

    }

    @Test
    void testSaveCustomOrder() {

    }

    @Test
    void testUpdateCustomOrder() {

    }
}
