import { Cart, ProductInCart } from "../components/cart"
import { User } from "../components/user"
import { Product, Category } from "../components/product"
import db from "../db/db"
import ProductDAO from "./productDAO";
import UserDAO from "./userDAO";
import { CartNotFoundError, ProductNotInCartError, EmptyCartError } from "../errors/cartError";
import { DBError } from "../errors/dbError";

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {
    CheckExistingCurrentCart(user: User): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const sql = "SELECT * FROM cart WHERE username = ? AND paymentDate = 'X'";
            db.get(sql, [user.username], (err: Error | null, row: any) => {
                if (err) {
                    reject(new DBError());
                } else if (row) {
                    resolve(true);
                } else {
                    resolve(false)
                }
            });
        });
    }

    /**
    * Calculates the total price of a user's cart.
    * @param user - The user who owns the cart. It must not be null.
    * @param paymentDate - The paymentDate of the cart you want to define the total
    * @returns A Promise that resolves to the total price of the cart.
    */
    getCartTotal(user: User, paymentDate: string): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const sql = `
                SELECT COALESCE(SUM(pc.quantity * p.sellingPrice),0) AS total
                FROM productInCart pc
                JOIN product p ON pc.model = p.model
                WHERE pc.username = ? AND pc.paymentDate = ?
            `;
            db.get(sql, [user.username, paymentDate], (err: Error | null, row: any) => {
                if (err) {
                    reject(new DBError());
                    return;
                }
                resolve(row ? row.total : 0);
            });
        });
    }

    /**
     * Updates the quantity of a product in the user's cart.
     * @param user - The user who owns the cart. It must not be null.
     * @param product - The product to update. It must not be null.
     * @param quantity - The quantity to set. It must be greater than 0.
     * @returns A Promise that resolves to true if the quantity has been updated.
     */
    updateProductQuantity(user: User, product: string, quantity: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (quantity < 0) {
                reject("Incorrect quantity");
                return;
            }
            const sql = 'UPDATE productInCart SET quantity = ? WHERE username = ? AND model = ? AND paymentDate = "X"'; //TODO here we can put paid = 0 instead (which one is better ?)
            db.run(sql, [quantity, user.username, product], (err: Error | null) => {
                if (err) {
                    reject(new DBError());
                    return;
                }
                resolve(true);
            });
        });
    }

    /**
    * Creates a new cart for a given user.
    * The cart is initialized with a fictive payment date ("X"),
    * unpaid (paid = 0), and a total of 0.
    * @param user The user for whom the cart is created. It must not be null.
    * @returns A promise resolved with the newly created cart.
    */
    createCart(user: User): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sql = `INSERT INTO cart (username, paid, paymentDate) VALUES (?, 0, "X")`;
            db.run(sql, [user.username], function (err: Error | null) {
                if (err) {
                    reject(new DBError());
                    return;
                }
                resolve(); //add the attributes of cart !
            });
        });
    }

    /**
    * Inserts a product into a user's cart with an initial quantity of 1.
    * The payment date is set to "X".
    * @param user The user to whom the product is added to the cart.
    * @param product The model of the product to insert into the cart.
    * @returns A promise resolved once the product insertion into the cart is completed.
    */
    insertProductInCart(user: User, product: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sql = `INSERT INTO productInCart (username, model, quantity, paymentDate) VALUES (?, ?, 1, "X")`;
            db.run(sql, [user.username, product], (err: Error | null) => {
                if (err) {
                    reject(new DBError());
                    return;
                }
                resolve();
            });
        });
    }



    /**
     * Add a product to the user cart.
     * @param user - The user that is adding the product. It must not be null.
     * @param product - The model of the product that is being added. It must not be null.
     * @returns A Promise that resolves to true if the product has been added.
     */
    addToCart(user: User, product: string) /**:Promise<Boolean> */ {

        return new Promise<boolean>(async (resolve, reject) => {
            try {

                const ExistingCart = await this.CheckExistingCurrentCart(user)

                if (ExistingCart == false) {
                    this.createCart(user)
                }

                let cart = await this.getCart(user);

                // Check if product is already in cart
                const existingProduct = cart.products.find(p => p.model === product)
                //console.log(existingProduct)
                if (existingProduct) {
                    // if yes add 1 to quantity
                    await this.updateProductQuantity(user, product, existingProduct.quantity + 1);
                } else {
                    // if no insert the product
                    await this.insertProductInCart(user, product);
                }

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
    * Returns the current cart for a user.
    * @param user - The user to retrieve the cart for. It must not be null.
    * @returns A Promise that resolves to the user's cart.
    */
    getCart(user: User): Promise<Cart> {
        return new Promise<Cart>((resolve, reject) => {
            try {
                const sql = `SELECT * FROM cart WHERE username = ? AND paymentDate = "X"`;
                db.get(sql, [user.username], async (err: Error | null, row: any) => {
                    if (err) {
                        reject(new DBError());
                        return;
                    }

                    if (!row) {
                        resolve(new Cart(user.username, false, null, 0, []))
                        return;
                    }

                    const cart = new Cart(
                        user.username,
                        Boolean(row.paid),
                        null,
                        0,
                        [] // Initialize with empty array for products
                    );

                   
                        const pdao = new ProductDAO();
                        const [total, products] = await Promise.all([
                            this.getCartTotal(user, row.paymentDate),
                            pdao.getProductsOfCart(cart)
                        ]);

                        cart.total = total;
                        cart.products = products;

                        resolve(cart);
                  
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Checks out the user's cart.
     * @param user - The user to check out the cart for. It must not be null.
     * @returns A Promise that resolves to true if the cart has been checked out.
     */
    checkoutCart(user: User): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                const pdao = new ProductDAO();
                const cart = await this.getCart(user);

                // Create a new cart
                const paymentDate = new Date().toISOString();
                const createCartSql = `INSERT INTO cart (username, paid, paymentDate) VALUES (?, ?, ?)`;
                await new Promise<void>((resolve, reject) => {
                    db.run(createCartSql, [user.username, 1, paymentDate], (err: Error | null) => {
                        if (err) {
                            reject(new DBError());

                        }
                        resolve();
                    });
                });

                // Loop through each product in the cart and add to the new cart
                for (const product of cart.products) {
                    const insertProductSql = `INSERT INTO productInCart (username, model, quantity, paymentDate) VALUES (?, ?, ?, ?)`;
                    await new Promise<void>((resolve, reject) => {
                        db.run(insertProductSql, [user.username, product.model, product.quantity, paymentDate], (err: Error | null) => {
                            if (err) {
                                reject(new DBError());

                            }
                            resolve();
                        });
                    });

                    const prod = await pdao.getProductByModel(product.model);
                    await new Promise<void>((resolve, reject) => {
                        db.run('UPDATE product SET quantity = ? WHERE model = ?', [prod.quantity - product.quantity, product.model], (err: Error | null) => {
                            if (err) {
                                reject(new DBError());

                            }
                            resolve();
                        });
                    });
                }

                // Delete all products from the old cart
                const deleteProductSql = 'DELETE FROM productInCart WHERE username = ? AND paymentDate = "X"';
                await new Promise<void>((resolve, reject) => {
                    db.run(deleteProductSql, [user.username], (err: Error | null) => {
                        if (err) {
                            reject(new DBError());
                            return;
                        }
                        resolve();
                    });
                });

                // Delete the old cart
                const deleteCartSql = 'DELETE FROM cart WHERE username = ? AND paymentDate = "X"';
                await new Promise<void>((resolve, reject) => {
                    db.run(deleteCartSql, [user.username], (err: Error | null) => {
                        if (err) {
                            reject(new DBError());

                        }
                        resolve();
                    });
                });

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Returns all paid carts for a specific customer.
     * @param user - The user to retrieve the carts for. It must not be null.
     * @returns A Promise that resolves to an array of carts.
     */
    getCustomerCarts(user: User) /**:Promise<Cart[]> */ {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM cart WHERE username = ? AND paid = 1";
                db.all(sql, [user.username], (err: Error | null, rows: any[]) => {
                    if (err) reject(new DBError());

                    const pdao = new ProductDAO();
                    const cartPromises: Promise<Cart>[] = rows.map(row => {
                        const cart = new Cart(
                            user.username,
                            Boolean(row.paid),
                            row.paymentDate,
                            0,
                            []
                        );

                        return pdao.getProductsOfCart(cart).then(products => {
                            cart.products = products;
                            return this.getCartTotal(user, row.paymentDate).then(total => {
                                cart.total = total;
                                cart.paymentDate = cart.paymentDate.substring(0,10)
                                return cart;
                            });
                        });
                    });

                    Promise.all(cartPromises).then(carts => {
                        resolve(carts);
                        //console.log(carts)
                    }).catch(error => {
                        reject(error);
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Removes a product from the user's cart.
     * @param user - The user that owns the cart. It must not be null.
     * @param product - The model of the product to remove. It must not be null.
     * @returns A Promise that resolves to true if the product has been removed.
     */
    removeProductFromCart(user: User, product: string) /**:Promise<Boolean> */ {
        return new Promise<boolean>(async (resolve, reject) => {
            try {

                let cart = await this.getCart(user);


                // Check if product is in the cart
                const existingProduct = cart.products.find(p => p.model === product)

                if (existingProduct) {
                    if (existingProduct.quantity > 1) {
                        await this.updateProductQuantity(user, product, existingProduct.quantity - 1);
                    }
                    else {
                        const sql = 'DELETE FROM productInCart WHERE username = ? AND model = ? AND paymentDate = "X"'
                        db.run(sql, [user.username, product], (err: Error | null, row: any) => {
                            if (err) {
                                reject(new DBError());

                            }
                        });
                    };
                }
                else {
                    reject(new ProductNotInCartError());

                }

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Clears the user's cart.
     * @param user - The user that owns the cart. It must not be null.
     * @returns A Promise that resolves to true if the cart has been cleared.
     */
    clearCart(user: User) /**:Promise<Boolean> */ {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM productInCart WHERE username = ? AND paymentDate ='X'";
                db.run(sql, [user.username], (err: Error | null) => {
                    if (err) reject(new DBError());
                    resolve(true);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Deletes all carts from the database.
     * @returns A Promise that resolves to true if the carts have been deleted.
     */
    deleteAllCarts() /**:Promise<Boolean> */ {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM productInCart";
                db.run(sql, (err: Error | null) => {
                    if (err) reject(new DBError());
                    const sql2 = "DELETE FROM cart";
                    db.run(sql2, (err: Error | null) => {
                        if (err) reject(new DBError());
                        resolve(true);
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    getAllCarts(): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            const sql = "SELECT * FROM cart";
            db.all(sql, [], async (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(new DBError());

                }

                const pdao = new ProductDAO();
                const udao = new UserDAO();
                const carts: Cart[] = [];

                for (const row of rows) {
                    try {
                        const paymentDate = row.paymentDate === "X" ? null : row.paymentDate;
                        const user = await udao.getUserByUsername(row.username);

                        const cart = new Cart(
                            row.username,
                            Boolean(row.paid),
                            paymentDate,
                            0,
                            []
                        );

                        const products = await pdao.getProductsOfCart(cart);
                        cart.products = products;

                        const total = await this.getCartTotal(user, row.paymentDate);
                        cart.total = total;

                        carts.push(cart);
                    } catch (error) {
                        reject(error);

                    }
                }

                resolve(carts);
            });
        });
    }
}

export default CartDAO