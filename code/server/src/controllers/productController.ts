import { check } from "express-validator";
import ProductDAO from "../dao/productDAO";
import {
    ProductAlreadyExistsError,
    ArrivalDateNotValidError,
    GroupingNotValidError,
    ProductNotFoundError,
    LowProductStockError
} from "../errors/productError";
/**
 * Represents a controller for managing products.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ProductController {
    private dao: ProductDAO

    constructor() {
        this.dao = new ProductDAO
    }

    /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
    async registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null) /**:Promise<void> */ {
        try {
            // Check if the product already exists
            let product = await this.dao.getProductByModel(model);
            if (product) {
                throw new ProductAlreadyExistsError();
            }

            var currentDate = new Date().toISOString().split('T')[0]
            if (arrivalDate) {
                if (this.invalidDate(arrivalDate)) {
                    throw new ArrivalDateNotValidError();
                }
            } else {
                arrivalDate = currentDate
            }

            return this.dao.registerProducts(model, category, quantity, details, sellingPrice, arrivalDate)
        } catch (error) {
            throw error;
        }
    }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model The model of the product to increase.
     * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async changeProductQuantity(model: string, newQuantity: number, changeDate: string | null) /**:Promise<number> */ {
        try {
            let product = await this.dao.getProductByModel(model);
            if (!product) {
                throw new ProductNotFoundError();
            }
            const currentDate = new Date().toISOString().split('T')[0];
            if (changeDate) {
                if (this.invalidDate(changeDate) || changeDate < product.arrivalDate) {
                    throw new ArrivalDateNotValidError();
                }
            } else {
                changeDate = currentDate;
            }
            let productQuantity = product.quantity;
            let newTotalQuantity = productQuantity + newQuantity;
            return this.dao.changeProductQuantity(model, newTotalQuantity, changeDate)
        } catch (error) {
            throw error;
        }
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async sellProduct(model: string, quantity: number, sellingDate: string | null) /**:Promise<number> */ {
        try {
            let product = await this.dao.getProductByModel(model);
            if (!product) {
                throw new ProductNotFoundError();
            }
            const currentDate = new Date().toISOString().split('T')[0];
            if (sellingDate) {
                if (this.invalidDate(sellingDate) || sellingDate < product.arrivalDate) {
                    throw new ArrivalDateNotValidError();
                }
            } else {
                sellingDate = currentDate;
            }
            let productQuantity = product.quantity - quantity;
            if (productQuantity < 0) {
                throw new LowProductStockError();
            }
            return this.dao.sellProduct(model, productQuantity, sellingDate)
        } catch (error) {
            throw error;
        }
    }

    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getProducts(grouping: string | null, category: string | null, model: string | null) /**Promise<Product[]> */ {
        try {
            await this.checkGrouping(grouping, category, model);
            return this.dao.getProducts(grouping, category, model, false)
        } catch (error) {
            throw error;
        }
    }

    /**
     * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getAvailableProducts(grouping: string | null, category: string | null, model: string | null) /**:Promise<Product[]> */ {
        try {
            await this.checkGrouping(grouping, category, model);
            return this.dao.getProducts(grouping, category, model, true)
        } catch (error) {
            throw error;
        }
    }

    /**
     * Deletes all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */
    async deleteAllProducts() /**:Promise <Boolean> */ {
        try {
            return this.dao.deleteAllProducts()
        } catch (error) {
            throw error;
        }
    }


    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    async deleteProduct(model: string) /**:Promise <Boolean> */ {
        try {
            let product = await this.dao.getProductByModel(model);
            if (!product) {
                throw new ProductNotFoundError();
            }
            return this.dao.deleteProduct(model)
        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if the date is valid  
     * @param date 
     * @param currentDate 
     * @returns true if the date is not valid
     */
    invalidDate(date: string): boolean {
        const parsedDate = new Date(date);
        const currentDate = new Date()

        return parsedDate > currentDate;
    }

    async checkGrouping(grouping: string | null, category: string | null, model: string | null) {
        if (!grouping && (category != null || model != null)) {
            throw new GroupingNotValidError();
        }

        if (grouping === 'category' && (!category || model)) {
            throw new GroupingNotValidError();
        }
        if (grouping === 'model' && (!model || category)) {
            throw new GroupingNotValidError();
        }
        if (grouping === 'model' && model !== '') {
            let product = await this.dao.getProductByModel(model);
            if (!product) {
                throw new ProductNotFoundError();
            }
        }
    }
}

export default ProductController;