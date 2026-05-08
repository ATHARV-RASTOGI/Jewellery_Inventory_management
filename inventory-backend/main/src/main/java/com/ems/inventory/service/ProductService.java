package com.ems.inventory.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ems.inventory.model.Product;
import com.ems.inventory.repository.ProductRepository;


@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;
    
    public Product saveProduct(Product newproduct) {
        return productRepository.save(newproduct);
    }

    public Product updateProduct(long id, Product updatedDetails) {
       Product existingProduct= productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

    existingProduct.setName(updatedDetails.getName());
    existingProduct.setSku(updatedDetails.getSku());
    existingProduct.setMainCategory(updatedDetails.getMainCategory());
    existingProduct.setSubCategory(updatedDetails.getSubCategory());
    existingProduct.setPurity(updatedDetails.getPurity());
    existingProduct.setBaseWeight(updatedDetails.getBaseWeight());
    existingProduct.setStockQuantity(updatedDetails.getStockQuantity());
    existingProduct.setPrice(updatedDetails.getPrice());


    return productRepository.save(existingProduct);

}

    public List<Product> getFilterProducts(String mainCategory, String subCategory, String purity , Double maxWeight){

        if (mainCategory != null && subCategory != null && purity != null && maxWeight != null) {
        return productRepository.findByMainCategoryAndSubCategoryAndPurityAndBaseWeightLessThanEqual(
                mainCategory, subCategory, purity, maxWeight);
        }
        else if(mainCategory != null && subCategory != null){
            return productRepository.findByMainCategoryAndSubCategory(mainCategory, subCategory);
        }
        else if(mainCategory != null){
            return productRepository.findByMainCategory(mainCategory);
        }
        return productRepository.findAll();
    }

    public List<Product> searchProduct(String keyword) {
        return productRepository.searchProducts(keyword);
    }

    public void deleteProduct(Long id) {
            productRepository.deleteById(id);
    }

    public Double getTotalvalue() {
        Double total = productRepository.getTotalvalue();
        return total != null ? total : 0.0;
    }

    public Long getTotalItems() {
        return productRepository.count();
    }

    public Double getliveGoldRate() {
        return  90000.00;
    }

    public Object getTotalLoanAmount() {
        return 0.0;
    }

   
    public Integer getCountOfItemsWithLowStock() {
       return productRepository.countByStockQuantityLessThanEqual(3);
    }
}
