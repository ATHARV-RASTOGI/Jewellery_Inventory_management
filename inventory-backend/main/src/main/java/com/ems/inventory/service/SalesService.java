package com.ems.inventory.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.inventory.model.Product;
import com.ems.inventory.model.Saleitem;
import com.ems.inventory.model.Sales;
import com.ems.inventory.repository.ProductRepository;
import com.ems.inventory.repository.SaleItemRepository;
import com.ems.inventory.repository.SalesRepository;

@Service
public class SalesService {

    private final ProductRepository productRepository;
     private final SalesRepository saleRepository;
    private final SaleItemRepository saleItemRepository;

    public SalesService(ProductRepository productRepository, SalesRepository saleRepository ,SaleItemRepository saleItemRepository){
        this.productRepository=productRepository;
        this.saleItemRepository=saleItemRepository;
        this.saleRepository = saleRepository;
    }

    public List<Sales> getAllSales(){
        return saleRepository.findAllByOrderBySaleDateDesc();
    }

    public List<Saleitem> getItemsForSale(Long saleId) {
        return saleItemRepository.findBySale_IdOrderById(saleId);
    }

    @Transactional
    public Sales createsales(Sales sale, List<Map<String,Object>>items){
        Sales savedsale= saleRepository.save(sale);

        double subtotal=0.0;

        for(Map<String, Object> item : items){
            String sku= (String)item.get("sku");
            int quantity = ((Number) item.get("quantity")).intValue();
            double pricePerPiece = ((Number) item.get("pricePerPiece")).doubleValue();
        

        Product product= productRepository.findBySku(sku).orElseThrow(()-> new RuntimeException());
        if (product.getStockQuantity() < quantity) {
                throw new RuntimeException("Insufficient stock for: " + sku);
            }

       
        product.setStockQuantity(product.getStockQuantity() - quantity);
        productRepository.save(product);

        Saleitem saleitem = new Saleitem();

        saleitem.setSale(savedsale);
        saleitem.setSku(sku);
        saleitem.setProductName(product.getName());
        saleitem.setMaterial(product.getMaterial());
        saleitem.setPurity(product.getPurity());
        saleitem.setWeight(product.getBaseWeight());
        saleitem.setQuantity(quantity);
        saleitem.setPricePerPiece(pricePerPiece);
        saleitem.setLineTotal(pricePerPiece * quantity);
        saleItemRepository.save(saleitem);

        subtotal += pricePerPiece * quantity;
        }

        double gst = subtotal * 0.03;
        savedsale.setSubtotal(subtotal);
        savedsale.setGstAmount(gst);
        savedsale.setGrandTotal(subtotal + gst);

        return saleRepository.save(savedsale);

    }

}
