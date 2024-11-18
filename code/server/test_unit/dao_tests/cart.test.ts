import { jest } from "@jest/globals";
import db from "../../src/db/db";
import CartDAO from "../../src/dao/cartDAO";
import { User, Role } from "../../src/components/user";
import { Product, Category } from "../../src/components/product";
import { CartNotFoundError, ProductNotInCartError, EmptyCartError } from "../../src/errors/cartError";
import { ProductNotFoundError, LowProductStockError } from "../../src/errors/productError";
import ProductDAO from "../../src/dao/productDAO";
import { Cart, ProductInCart } from '../../src/components/cart';
import UserDAO from "../../src/dao/userDAO";

jest.mock("../../src/db/db");
//jest.mock("../../src/dao/productDAO");
jest.mock("../../src/dao/userDAO")

describe("CartDAO", () => {
    let cartDAO: CartDAO;
    let productDAO: ProductDAO;
    let userDAO : UserDAO;
    let user: User;

    beforeAll(() => {
        cartDAO = new CartDAO();
        productDAO = new ProductDAO();
        userDAO = new UserDAO();
        user = new User("john_doe", "John", "Doe", Role.CUSTOMER, "123 Main St", "1990-01-01");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    
    test ("C_DAO01 - should resolve true if user have a current cart in db", async() => {
        const dbGetSpy = jest.spyOn(db, 'get').mockImplementation((sql : string, params : any[], callback : any) => {
            callback(null,{username :user.username, paid : 0, paymentDate : "X"});
            return {} as any;
        });

        await expect(cartDAO.CheckExistingCurrentCart(user)).resolves.toBe(true);
        expect(dbGetSpy).toHaveBeenCalledWith(
            "SELECT * FROM cart WHERE username = ? AND paymentDate = 'X'",
            [user.username],
            expect.any(Function)
        );
    })

    test ("C_DAO02 - should resolve false if user do not have a current cart in db", async() => {
        const dbGetSpy = jest.spyOn(db, 'get').mockImplementation((sql : string, params : any[], callback : any) => {
            callback(null,null);
            return {} as any;
        });

        await expect(cartDAO.CheckExistingCurrentCart(user)).resolves.toBe(false);
        expect(dbGetSpy).toHaveBeenCalledWith(
            "SELECT * FROM cart WHERE username = ? AND paymentDate = 'X'",
            [user.username],
            expect.any(Function)
        );
    })


    test("C_DAO03 - should create a new cart for the user", async () => {
        const dbRunSpy = jest.spyOn(db, 'run').mockImplementation((sql : string, params : any[], callback : any) => {
            callback(null);
            return {} as any;
        });

        await expect(cartDAO.createCart(user)).resolves.toBeUndefined();
        expect(dbRunSpy).toHaveBeenCalledWith(
            `INSERT INTO cart (username, paid, paymentDate) VALUES (?, 0, "X")`,
            [user.username],
            expect.any(Function)
        );
        dbRunSpy.mockRestore();
    });

    test("C_DAO06 - should calculate the total price of a user's current cart", async () => {
        const dbGetSpy = jest.spyOn(db, "get").mockImplementation((sql : string, params : any[], callback : any) => {
            const mockRow = { total : 2097}
            callback(null, mockRow);
            return {} as any;
        });

        await expect(cartDAO.getCartTotal(user, "X")).resolves.toBe(2097);
        expect(dbGetSpy).toHaveBeenCalledWith(`
                SELECT COALESCE(SUM(pc.quantity * p.sellingPrice),0) AS total
                FROM productInCart pc
                JOIN product p ON pc.model = p.model
                WHERE pc.username = ? AND pc.paymentDate = ?
            `, [user.username,"X"], expect.any(Function)
        );
        dbGetSpy.mockRestore();
    });

    //GetCart

    test('C_DAO10 - should get the user current cart when it exists', async () =>{
        const product1 = new ProductInCart('model123', 3, Category.SMARTPHONE, 50)
        const product2 = new ProductInCart('model456', 4, Category.LAPTOP, 25)
        
        const dbGetSpy = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) =>{
            callback(null, {username : user.username, paid : 0, paymentDate : 'X'})
            return {} as any
        });
        const getCartTotalSpy = jest.spyOn(cartDAO, 'getCartTotal').mockResolvedValue(250)
        const getProductsOfCartSpy = jest.spyOn(ProductDAO.prototype, 'getProductsOfCart').mockResolvedValueOnce([product1,product2])
              
        const cart = await cartDAO.getCart(user);
        expect(cart.customer).toBe(user.username);
        expect(cart.paid).toBe(false);
        expect(cart.paymentDate).toBe(null);
        expect(cart.total).toBe(250);
        expect(cart.products).toEqual([product1, product2]);

        expect (dbGetSpy).toHaveBeenCalledWith('SELECT * FROM cart WHERE username = ? AND paymentDate = "X"',[user.username],expect.any(Function))
        expect (getProductsOfCartSpy).toHaveBeenCalledWith(expect.objectContaining({ customer: user.username, paid: false, paymentDate: null}))
        expect (getCartTotalSpy).toHaveBeenCalledWith(user, "X")
    })

    test('C_DAO11 - should get the user current cart when it does not exist', async () =>{
        
        const dbGetSpy = jest.spyOn(db, 'get').mockImplementationOnce((sql, params, callback) =>{
            callback(null, null)
            return {} as any
        });

        const cart = await cartDAO.getCart(user);
        expect(cart).toEqual({ customer: user.username, paid: false, paymentDate: null, total: 0, products: [] })
        expect (dbGetSpy).toHaveBeenCalledWith('SELECT * FROM cart WHERE username = ? AND paymentDate = "X"',[user.username],expect.any(Function))  
        
    })

    // Get all Carts

    test('C_DAO19 - should return all carts from the db', async () => {
        const user1 = new User("username1", "John", "Doe", Role.CUSTOMER, "123 Main St", "1990-01-01");
        const user2 = new User("username2", "Tom", "To", Role.CUSTOMER, "456 Main St", "2000-01-01");
    
        const cartData = [
            { username: user1.username, paid: 1, paymentDate: "2022-01-01" },
            { username: user1.username, paid: 0, paymentDate: "X" },
            { username: user2.username, paid: 1, paymentDate: "2022-02-01" }
        ];
    
        const product1 = new ProductInCart("model1", 10, Category.SMARTPHONE, 100);
        const product2 = new ProductInCart("model2", 7, Category.LAPTOP, 200);
        const product3 = new ProductInCart("model3", 3, Category.APPLIANCE, 150);
    
       
    
        // Mock the userDAO.getUserByUsername method
        jest.spyOn(userDAO, 'getUserByUsername').mockImplementation((u) => {
            if (u === user1.username) {
                return Promise.resolve(user1);
            } else if (u === user2.username) {
                return Promise.resolve(user2);
            } else {
                return Promise.reject(new Error('User not found'));
            }
        });
    
        jest.spyOn(userDAO, 'getUserByUsername').mockResolvedValueOnce(user1).mockResolvedValueOnce(user1).mockResolvedValueOnce(user2); 
     
        // Mock the productDAO.getProductsOfCart method 
        jest.spyOn(productDAO, 'getProductsOfCart').mockResolvedValueOnce([product1]).mockResolvedValueOnce([product2]).mockResolvedValueOnce([product3]); 
     
        // Mock the cartDAO.getCartTotal method 
        jest.spyOn(cartDAO, 'getCartTotal').mockResolvedValueOnce(1000).mockResolvedValueOnce(1400).mockResolvedValueOnce(450); 
 
        // Mock the db.all method 
        const dbAllSpy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => { 
            callback(null, cartData); 
            return {} as any; 
        });
    
        // Retrieve all carts
        const carts = await cartDAO.getAllCarts();
    
        // Assertions
        expect(carts).toHaveLength(3);
    
        expect(carts[0].customer).toBe(user1.username);
        expect(carts[0].paid).toBe(true);
        expect(carts[0].paymentDate).toBe("2022-01-01");
        expect(carts[0].products).toEqual([product1]);
        expect(carts[0].total).toBe(1000);
    
        expect(carts[1].customer).toBe(user1.username);
        expect(carts[1].paid).toBe(false);
        expect(carts[1].paymentDate).toBe(null);
        expect(carts[1].products).toEqual([product2]);
        expect(carts[1].total).toBe(1400);
    
        expect(carts[2].customer).toBe(user2.username);
        expect(carts[2].paid).toBe(true);
        expect(carts[2].paymentDate).toBe("2022-02-01");
        expect(carts[2].products).toEqual([product3]);
        expect(carts[2].total).toBe(450);
    
        // Verify spy calls
        expect(dbAllSpy).toHaveBeenCalledWith(
            'SELECT * FROM cart',
            [],
            expect.any(Function)
        );
    
        //expect(userDAO.getUserByUsername).toHaveBeenCalledTimes(3);
    
        //expect(productDAO.getProductsOfCart).toHaveBeenCalledTimes(3);
        expect(cartDAO.getCartTotal).toHaveBeenCalledTimes(3);
    });

    test("C_DAO04 - should insert a product in the cart in the cart", async () => {
        const product = new Product(699, "product_001", Category.SMARTPHONE, null, "A very smart phone", 10);

        const dbRunSpy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as any;
        });

        await expect(cartDAO.insertProductInCart(user, product.model)).resolves.toBeUndefined();
        expect(dbRunSpy).toHaveBeenCalledWith(
            `INSERT INTO productInCart (username, model, quantity, paymentDate) VALUES (?, ?, 1, "X")`,
            [user.username, product.model],
            expect.any(Function)
        );
        dbRunSpy.mockRestore();
    });

    test("C_DAO05 - should update the quantity of a product in the user's cart", async () => {
        const product = new Product(699, "product_001", Category.SMARTPHONE, null, "A very smart phone", 10);

        const dbRunSpy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as any;
        });

        await expect(cartDAO.updateProductQuantity(user, product.model, 5)).resolves.toBe(true);
        expect(dbRunSpy).toHaveBeenCalledWith(
            'UPDATE productInCart SET quantity = ? WHERE username = ? AND model = ? AND paymentDate = "X"',
            [5, user.username, product.model],
            expect.any(Function)
        );
        dbRunSpy.mockRestore();
    });

    //AddToCart

    test('C_DAO07 - should add to cart when cart does not exist', async () => {
        const product = new Product(100, 'model123', Category.SMARTPHONE, '2022-01-01', 'Test Product', 10);

        const CheckExistingCurrentCartSpy = jest.spyOn(cartDAO, 'CheckExistingCurrentCart').mockResolvedValue(false)
        const createCartSpy = jest.spyOn(cartDAO, 'createCart').mockResolvedValue();
        const getCartSpy = jest.spyOn(cartDAO, 'getCart').mockResolvedValue(new Cart(user.username, false, "", 0, []));
        const insertProductInCartSpy = jest.spyOn(cartDAO, 'insertProductInCart').mockResolvedValue();

        const result = await cartDAO.addToCart(user, 'model123');
        expect(result).toBe(true);
        expect(createCartSpy).toHaveBeenCalledWith(user);
        expect(getCartSpy).toHaveBeenCalledWith(user);
        expect(insertProductInCartSpy).toHaveBeenCalledWith(user, 'model123');
    });

    test('C_DAO08 - should add to cart when cart exists but product is not in cart', async () => {
        let cart = new Cart(user.username, false, "", 0, []); //I put "" instead of null for the paymentDate because there is an error with my constructor if I put null
        const product = new Product(100, 'model123', Category.SMARTPHONE, '2022-01-01', 'Test Product', 10);

        const CheckExistingCurrentCartSpy = jest.spyOn(cartDAO, 'CheckExistingCurrentCart').mockResolvedValue(true)
        const getCartSpy = jest.spyOn(cartDAO, 'getCart').mockResolvedValue(cart);
        const insertProductInCartSpy = jest.spyOn(cartDAO, 'insertProductInCart').mockResolvedValue();

        const result = await cartDAO.addToCart(user, 'model123');
        expect(result).toBe(true);
        expect(getCartSpy).toHaveBeenCalledWith(user);
        expect(insertProductInCartSpy).toHaveBeenCalledWith(user, 'model123');
    });

    test('C_DAO09 - should add to cart when product is already in cart', async () => {
        const cart = new Cart(user.username, false, "", 0, [new ProductInCart('model123', 1, Category.SMARTPHONE, 100)]);
        const product = new Product(100, 'model123', Category.SMARTPHONE, '2022-01-01', 'Test Product', 10);

        const CheckExistingCurrentCartSpy = jest.spyOn(cartDAO, 'CheckExistingCurrentCart').mockResolvedValue(true)
        const getCartSpy = jest.spyOn(cartDAO, 'getCart').mockResolvedValue(cart);
        const updateProductQuantitySpy = jest.spyOn(cartDAO, 'updateProductQuantity').mockResolvedValue(true);

        const result = await cartDAO.addToCart(user, 'model123');
        expect(result).toBe(true);
        expect(getCartSpy).toHaveBeenCalledWith(user);
        expect(updateProductQuantitySpy).toHaveBeenCalledWith(user, 'model123', 2);
    });

    //Checkout

    test("C_DAO12 - should checkout the user's cart when it is not empty", async () => {
        const product1 = new ProductInCart("model1", 1, Category.SMARTPHONE, 100);
        const product2 = new ProductInCart("model2", 1, Category.LAPTOP, 150);
        
        jest.spyOn(cartDAO, 'getCart').mockResolvedValue(new Cart(user.username, false, '', 250, [product1, product2]));
        const getProductByModelSpy = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(new Product(100, "model1", Category.SMARTPHONE, '2022-01-01', 'Test Product', 4))
        const getProductByModelSpy2 = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(new Product(150, "model2", Category.LAPTOP, '2022-01-01', 'Test Product 2', 7))
    
        const dbRunSpy = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as any;
        });
    
        await expect(cartDAO.checkoutCart(user)).resolves.toBe(true);

        expect(getProductByModelSpy).toHaveBeenCalledWith("model1")
        expect(getProductByModelSpy2).toHaveBeenCalledWith("model2")
    
        expect(dbRunSpy).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO cart'),
            expect.any(Array),
            expect.any(Function)
        );
    
        expect(dbRunSpy).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO productInCart'),
            expect.any(Array),
            expect.any(Function)
        );
    
        expect(dbRunSpy).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE product SET quantity = ? WHERE model = ?'),
            expect.any(Array),
            expect.any(Function)
        );
    
        expect(dbRunSpy).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM productInCart'),
            [user.username],
            expect.any(Function)
        );
    
        expect(dbRunSpy).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM cart'),
            [user.username],
            expect.any(Function)
        );
    });

    //Remove From Cart

    test('C_DAO13 - should remove product from cart when cart exists and many instances of the product are in cart', async () => {
        const cart = new Cart(user.username, false, "", 500, [new ProductInCart('model123', 5, Category.SMARTPHONE, 100)]);
    
        const getCartSpy = jest.spyOn(cartDAO, 'getCart').mockResolvedValue(cart);
        const updateProductQuantitySpy = jest.spyOn(cartDAO, 'updateProductQuantity').mockResolvedValue(true);
    
        const result = await cartDAO.removeProductFromCart(user, 'model123');
        expect(result).toBe(true);
        expect(getCartSpy).toHaveBeenCalledWith(user);
        expect(updateProductQuantitySpy).toHaveBeenCalledWith(user,'model123',4)
    });
    
    test('C_DAO14 - should remove product from cart when cart exists and one instance of the product is in cart', async () => {
        const cart = new Cart(user.username, false, "", 100, [new ProductInCart('model123', 1, Category.SMARTPHONE, 100)]);
    
        const getCartSpy = jest.spyOn(cartDAO, 'getCart').mockResolvedValue(cart);
        const dbRunSpy = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) =>{
            callback(null)
            return {} as any
        });
    
        const result = await cartDAO.removeProductFromCart(user, 'model123');
        expect(result).toBe(true);
        expect(getCartSpy).toHaveBeenCalledWith(user);
        expect(dbRunSpy).toHaveBeenCalledWith('DELETE FROM productInCart WHERE username = ? AND model = ? AND paymentDate = "X"',[user.username,'model123'], expect.any(Function))
    });
    
    test('C_DAO15 - should not remove and reject when product is not in cart', async () => {
        const cart = new Cart(user.username, false, "", 0, []);
    
        const getCartSpy = jest.spyOn(cartDAO, 'getCart').mockResolvedValue(cart);
    
        await expect(cartDAO.removeProductFromCart(user, 'model123')).rejects.toThrow(ProductNotInCartError);
        
        expect(getCartSpy).toHaveBeenCalledWith(user);
    });

    //Clear Cart

    test('C_DAO16 - should clear the user current cart', async () => {
        const dbRunSpy = jest.spyOn(db, 'run').mockImplementationOnce((sql, params, callback) =>{
            callback(null)
            return {} as any
        });

        const result = await cartDAO.clearCart(user);
        expect(result).toBe(true);
        expect(dbRunSpy).toHaveBeenCalledWith("DELETE FROM productInCart WHERE username = ? AND paymentDate ='X'",[user.username],expect.any(Function))
    })

    //Get Customer's carts historic

    test("C_DAO17 - should return all paid carts for a specific customer", async () => {
        const cartData = [
            { username: user.username, paid: 1, paymentDate: "2022-01-01" },
            { username: user.username, paid: 1, paymentDate: "2022-02-01" }
        ];
        const product1 = new ProductInCart("model1", 10, Category.SMARTPHONE, 100);
        const product2 = new ProductInCart("model2", 5, Category.LAPTOP, 200);
        const product3 = new ProductInCart("model3", 6, Category.APPLIANCE, 50);
    
        const dbAllSpy = jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
            callback(null, cartData);
            return {} as any;
        });
    
        jest.spyOn(productDAO, 'getProductsOfCart').mockImplementation((cart) => {
            if (cart.paymentDate === "2022-01-01") {
                return Promise.resolve([product1]);
            } else {
                return Promise.resolve([product2, product3]);
            }
        });
    
        const getCartTotalSpy = jest.spyOn(cartDAO, 'getCartTotal')
            .mockResolvedValueOnce(1000)
            .mockResolvedValueOnce(1300);
    
        // Appel de la fonction à tester
        const carts = await new Promise<Cart[]>((resolve, reject) => {
            cartDAO.getCustomerCarts(user).then(resolve).catch(reject);
        });
    
        // Assertions
        expect(carts).toHaveLength(2);
        expect(carts[0].products).toEqual([product1]);
        expect(carts[0].total).toBe(1000);
        expect(carts[1].products).toEqual([product2, product3]);
        expect(carts[1].total).toBe(1300);
    
        // Vérification des appels des spies
        expect(dbAllSpy).toHaveBeenCalledWith(
            'SELECT * FROM cart WHERE username = ? AND paid = 1',
            [user.username],
            expect.any(Function)
        );
        expect(productDAO.getProductsOfCart).toHaveBeenCalledTimes(2);
        expect(cartDAO.getCartTotal).toHaveBeenCalledTimes(2);
    });

    // Delete all Carts

    test('C_DAO18 - should delete all carts from db', async () =>{
        const dbRunSpy1 = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
            callback(null);
            return {} as any
        });
    
        const dbRunSpy2 = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
            callback(null);
            return {} as any
        });
    
        await expect(cartDAO.deleteAllCarts()).resolves.toBe(true);
    
        expect(dbRunSpy1).toHaveBeenCalledWith(
            'DELETE FROM productInCart',
            expect.any(Function)
        );
    
        expect(dbRunSpy2).toHaveBeenCalledWith(
            'DELETE FROM cart',
            expect.any(Function)
        );
    });

});