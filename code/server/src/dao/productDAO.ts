import db from "../db/db"
import { Category, Product } from "../components/product"
import { ProductInCart, Cart } from "../components/cart";
import { DBError } from "../errors/dbError";

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {

    /**
     * Retrieve information about a product by its model.
     * @param product - The model of the product.
     * @returns A Promise that resolves to the product or null if it doesn't exist.
     */
    getProductByModel(product: string): Promise<Product | null> {
        return new Promise<Product | null>((resolve, reject) => {
            const sql = "SELECT * FROM product WHERE model = ?";
            db.get(sql, [product], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    const product = new Product(
                        row.sellingPrice,
                        row.model,
                        row.category as Category,
                        row.arrivalDate,
                        row.details,
                        row.quantity
                    );
                    resolve(product);
                }
            });
        });
    }



    /**
    * Retrieve products of a specific cart
    * @param cart - The cart to retrieve products from.
    * @returns A Promise that resolves to an array of products.
    */
    getProductsOfCart(cart: Cart): Promise<ProductInCart[]> {
        return new Promise<ProductInCart[]>((resolve, reject) => {
            try {
                const paymentDate = cart.paymentDate === null ? "X" : cart.paymentDate;
                const sql = `
                SELECT pc.model, pc.quantity, p.category, p.sellingPrice
                FROM productInCart pc 
                JOIN product p ON pc.model = p.model 
                WHERE pc.username = ? AND pc.paymentDate = ?
                `;
                db.all(sql, [cart.customer, paymentDate], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                    }
                    const products: ProductInCart[] = []
                    for (const row of rows) {
                        const product = new ProductInCart(
                            row.model,
                            row.quantity,
                            row.category,
                            row.sellingPrice,
                        )
                        products.push(product)
                    }

                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Register a new product in the database.
     * @param model  The model of the product to register.
     * @param category  The category of the product to register.
     * @param quantity  The quantity of the product to register.
     * @param details  The details of the product to register.
     * @param sellingPrice  The selling price of the product to register.
     * @param arrivalDate  The arrival date of the product to register.
     * @returns A Promise that resolves to void.
     */
    registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Register the product
                const sql = `
                        INSERT INTO product (model, category, quantity, details, sellingPrice, arrivalDate)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                db.run(sql, [model, category, quantity, details, sellingPrice, arrivalDate], (err) => {
                    if (err) {
                        return reject(new DBError());
                    }
                    resolve();
                });

            } catch (error) {
                reject(error);
            }

        });
    }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model  The model of the product to increase.
     * @param newQuantity  The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred. 
     * @returns  A Promise that resolves to the new available quantity of the product.
     */
    changeProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            try {
                db.run('UPDATE product SET quantity = ? WHERE model = ?', [newQuantity, model], (err) => {
                    if (err) {
                        return reject(new DBError());
                    }
                    resolve(newQuantity);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model  The model of the product to sell
     * @param quantity  The number of product units that were sold.
     * @param sellingDate  The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            try {
                db.run('UPDATE product SET quantity = ? WHERE model = ?', [quantity, model], (err) => {
                    if (err) {
                        return reject(new DBError());
                    }
                    resolve(quantity);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Retrieve all products in the database based on the model
     * @param grouping  The grouping of the products to retrieve.
     * @param category  The category of the products to retrieve.
     * @param model  The model of the products to retrieve.
     * @param available  A boolean indicating whether to retrieve only available products.
     * @returns A Promise that resolves to an array of products.
     * @throws DBError
    */
    getProducts(grouping: string | null, category: string | null, model: string | null, available: boolean): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                // Retrieve products
                let sql = 'SELECT * FROM product';
                if (available) {
                    sql += ' WHERE quantity > 0';
                }
                if (grouping) {
                    if (available) {
                        if (category) {
                            sql += ` AND category = '${category}'`;
                        }
                        if (model) {
                            sql += ` AND model = '${model}'`;
                        }
                    }
                    else {
                        if (category) {
                            sql += ` WHERE category = '${category}'`;
                        }
                        if (model) {
                            sql += ` WHERE model = '${model}'`;
                        }
                    }
                }
                db.all(sql, (err, rows) => {
                    if (err) {
                        return reject(new DBError());
                    }
                    const products: Product[] = rows.map((row: any) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity,));
                    resolve(products);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Delete all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */
    deleteAllProducts(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                // Delete all products
                db.run('DELETE FROM product', (err) => {
                    if (err) {
                        return reject(new DBError());
                    }
                    resolve(true);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Delete a product by model.
     * @param model The model of the product to delete.
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    deleteProduct(model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                // Delete the product
                db.run('DELETE FROM product WHERE model = ?', [model], (err) => {
                    if (err) {
                        return reject(new DBError());
                    }
                    resolve(true);
                });

            } catch (error) {
                reject(error);
            }
        });
    }


}

export default ProductDAO