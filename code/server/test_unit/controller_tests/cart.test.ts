import CartController from '../../src/controllers/cartController';
import { User, Role } from '../../src/components/user';
import { Cart, ProductInCart } from '../../src/components/cart';
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from '../../src/errors/cartError';
import { ProductNotFoundError, LowProductStockError } from "../../src/errors/productError";
import { Product, Category } from "../../src/components/product";
import ProductDAO from "../../src/dao/productDAO";
import CartDAO from '../../src/dao/cartDAO';

jest.mock("../../src/dao/cartDAO");
jest.mock("../../src/dao/productDAO");

const mockedCartDAO = CartDAO as jest.MockedClass<typeof CartDAO>;

// Mock a sample user
const user: User = new User(
    'john_doe',
    'John',
    'Doe',
    Role.CUSTOMER,
    '123 Main St',
    '1990-01-01'
);
const prod : Product = new Product(500, "model123", Category.SMARTPHONE, '2022-01-01', 'Test Product', 10)

// Mock a sample product
const product: ProductInCart = new ProductInCart(
    'model123',
    2,
    Category.SMARTPHONE,
    500
);

// Mock a sample cart
const cart: Cart = new Cart(
    'john_doe',
    false,
    '',
    500,
    [product]
);


describe('CartController', () => {
    let cartController: CartController;

    beforeEach(() => {
        // Reset all mock implementations before each test
        jest.clearAllMocks();
        cartController = new CartController();
    });

    describe('addToCart', () => {
        test('C_CONTROLLER_01 - should add product to cart', async () => {
            const getProductByModelSpy = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(prod);
    
            mockedCartDAO.prototype.addToCart.mockResolvedValue(true);
            const result = await cartController.addToCart(user, 'model123');
            expect(result).toBe(true);
            expect (getProductByModelSpy).toHaveBeenCalledWith('model123')
        });

        test('C_CONTROLLER_02 - should not add and reject when product does not exist', async () => {
            const getProductByModelSpy = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(null);
    
            await expect(cartController.addToCart(user, 'nonexistentmodel')).rejects.toThrow(ProductNotFoundError);
            expect (getProductByModelSpy).toHaveBeenCalledWith('nonexistentmodel')
        });
    
        test('C_CONTROLLER_03 - should not add and reject when product quantity is insufficient', async () => {
            const lowStockProduct = new Product(100, 'model123', Category.SMARTPHONE, '2022-01-01', 'Test Product', 0);
            const getProductByModelSpy = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(lowStockProduct);
    
            await expect(cartController.addToCart(user, 'model123')).rejects.toThrow(LowProductStockError);
            expect(getProductByModelSpy).toHaveBeenCalledWith('model123')
        });
    

    });

    describe('getCart', () => {
        test('C_CONTROLLER_04 - should get user cart', async () => {
            mockedCartDAO.prototype.getCart.mockResolvedValue(cart);
            const result = await cartController.getCart(user);
            expect(result).toEqual(cart);
        });

        test('C_CONTROLLER_05 - should return empty cart if no current cart exists', async () => {
            mockedCartDAO.prototype.getCart.mockResolvedValue(new Cart('sampleuser',false,'',0,[]));
            const result = await cartController.getCart(user);
            expect(result).toEqual(new Cart('sampleuser',false,'',0,[]));
        });

    });

    describe('checkoutCart', () => {
        test('C_CONTROLLER_06 - should checkout user cart', async () => {
            const product1 = new ProductInCart("model1", 1, Category.SMARTPHONE, 100);
            const product2 = new ProductInCart("model2", 1, Category.LAPTOP, 150);
            const cart1 = new Cart (user.username,false,'',250,[product1,product2])

            const CheckExistingCurrentCartSpy = jest.spyOn(CartDAO.prototype, 'CheckExistingCurrentCart').mockResolvedValue(true)
            jest.spyOn(CartDAO.prototype, 'getCart').mockResolvedValue(cart1);
        
            const getProductByModelSpy = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(new Product(100,"model1", Category.SMARTPHONE,'2022-01-01','Test',5));
            const getProductByModelSpy2 = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(new Product(150,"model2", Category.LAPTOP,'2022-01-01','Test2',10));
            mockedCartDAO.prototype.checkoutCart.mockResolvedValue(true);
            const result = await cartController.checkoutCart(user);
            expect(result).toBe(true);
            expect(CheckExistingCurrentCartSpy).toHaveBeenCalledWith(user)
            expect(getProductByModelSpy).toHaveBeenCalledWith("model1")
            expect(getProductByModelSpy2).toHaveBeenCalledWith("model2")
        });

        test("C_CONTROLLER_07 - should throw an error if the cart is empty", async () => {    
            const CheckExistingCurrentCartSpy = jest.spyOn(CartDAO.prototype, 'CheckExistingCurrentCart').mockResolvedValue(true)
        
            // Mock getCart to return an empty cart
            const getCartSpy = jest.spyOn(CartDAO.prototype, 'getCart').mockResolvedValue(new Cart(user.username, false, '', 0, []));
        
            await expect(cartController.checkoutCart(user)).rejects.toThrow(EmptyCartError);
        
            expect(CheckExistingCurrentCartSpy).toHaveBeenCalledWith(user)
        
            expect(getCartSpy).toHaveBeenCalledWith(user);
        });
        
        test("C_CONTROLLER_08 - should throw an error if the cart does not exist", async () => {
            
            const CheckExistingCurrentCartSpy = jest.spyOn(CartDAO.prototype, 'CheckExistingCurrentCart').mockResolvedValue(false)
            await expect(cartController.checkoutCart(user)).rejects.toThrow(CartNotFoundError);
            expect(CheckExistingCurrentCartSpy).toHaveBeenCalledWith(user)
            
        });

        test("C_CONTROLLER_09 - should throw an error if a product in the cart does not exist", async () => {
            const product1 = new ProductInCart("model1", 5, Category.SMARTPHONE, 100);

            const CheckExistingCurrentCartSpy = jest.spyOn(CartDAO.prototype, 'CheckExistingCurrentCart').mockResolvedValue(true)
            jest.spyOn(CartDAO.prototype, 'getCart').mockResolvedValue(new Cart(user.username, false, '', 500, [product1]));
        
            const getProductByModelSpy = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(null);
        
            await expect(cartController.checkoutCart(user)).rejects.toThrow(ProductNotFoundError);
        
            expect(CheckExistingCurrentCartSpy).toHaveBeenCalledWith(user)
            expect(getProductByModelSpy).toHaveBeenCalledWith('model1');
        });
        
        test("C_CONTROLLER_10 - should throw an error if product stock is low", async () => {
            const product1 = new ProductInCart("model1", 5, Category.SMARTPHONE, 100);
            
            const CheckExistingCurrentCartSpy = jest.spyOn(CartDAO.prototype, 'CheckExistingCurrentCart').mockResolvedValue(true)
            jest.spyOn(CartDAO.prototype, 'getCart').mockResolvedValue(new Cart(user.username, false, '', 500, [product1]));
        
            const getProductByModelSpy = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(new Product(100, "model1", Category.SMARTPHONE, '2022-01-01', 'Test Product', 4));
        
            await expect(cartController.checkoutCart(user)).rejects.toThrow(LowProductStockError);
        
            expect(CheckExistingCurrentCartSpy).toHaveBeenCalledWith(user)
            expect(getProductByModelSpy).toHaveBeenCalledWith('model1');
        });
    });

    describe('getCustomerCarts', () => {
        test('C_CONTROLLER_11 - should get customer carts', async () => {
            const sampleCarts: Cart[] = [cart];
            mockedCartDAO.prototype.getCustomerCarts.mockResolvedValue(sampleCarts);
            const result = await cartController.getCustomerCarts(user);
            expect(result).toEqual(sampleCarts);
        });
    });

    describe('removeProductFromCart', () => {
        test('C_CONTROLLER_12 - should remove product from cart', async () => {
            const CheckExistingCurrentCartSpy = jest.spyOn(CartDAO.prototype, 'CheckExistingCurrentCart').mockResolvedValue(true)
            const getProductByModelSpy = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(prod);
            mockedCartDAO.prototype.removeProductFromCart.mockResolvedValue(true);
            const result = await cartController.removeProductFromCart(user, 'model123');
            expect(result).toBe(true);
            expect(getProductByModelSpy).toHaveBeenCalledWith('model123')
        });

        test('C_CONTROLLER_13 - should throw error if product is not in cart', async () => {
            const CheckExistingCurrentCartSpy = jest.spyOn(CartDAO.prototype, 'CheckExistingCurrentCart').mockResolvedValue(true)
            const getProductByModelSpy = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(prod);
            mockedCartDAO.prototype.removeProductFromCart.mockRejectedValue(new ProductNotInCartError());
            await expect(cartController.removeProductFromCart(user, 'invalidProduct')).rejects.toThrow(ProductNotInCartError);
            expect(getProductByModelSpy).toHaveBeenCalledWith('invalidProduct')
        });

        test('C_CONTROLLER_14 - should throw error if cart does not exist', async () => {
            const CheckExistingCurrentCartSpy = jest.spyOn(CartDAO.prototype, 'CheckExistingCurrentCart').mockResolvedValue(false)
            await expect(cartController.removeProductFromCart(user, 'invalidProduct')).rejects.toThrow(CartNotFoundError);
        });

        test('C_CONTROLLER_15 - should throw error if product does not exists', async () => {
            const CheckExistingCurrentCartSpy = jest.spyOn(CartDAO.prototype, 'CheckExistingCurrentCart').mockResolvedValue(true)
            const getProductByModelSpy = jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(null);
            await expect(cartController.removeProductFromCart(user, 'invalidProduct')).rejects.toThrow(ProductNotFoundError);
            expect(getProductByModelSpy).toHaveBeenCalledWith('invalidProduct')
        });

    })

    describe('clearCart', () => {
        test('C_CONTROLLER_16 - should clear user cart', async () => {
            mockedCartDAO.prototype.clearCart.mockResolvedValue(true);
            const result = await cartController.clearCart(user);
            expect(result).toBe(true);
        });

        test('C_CONTROLLER_17 - should throw error if cart not found', async () => {
            const CheckExistingCurrentCartSpy = jest.spyOn(CartDAO.prototype, 'CheckExistingCurrentCart').mockResolvedValue(false)
            await expect(cartController.clearCart(user)).rejects.toThrow(CartNotFoundError);
        });
    })

    describe('deleteAllCarts', () => {
        test('C_CONTROLLER_18 - should delete all carts', async () => {
            mockedCartDAO.prototype.deleteAllCarts.mockResolvedValue(true);
            const result = await cartController.deleteAllCarts();
            expect(result).toBe(true);
        });
    })

    describe('getAllCarts', () => {
        test('C_CONTROLLER_19 - should retrieve all carts', async () => {
            const allCarts = [cart, { ...cart, customer: 'anotherUser' }];
            mockedCartDAO.prototype.getAllCarts.mockResolvedValue(allCarts);
            const result = await cartController.getAllCarts();
            expect(result).toEqual(allCarts);
        })
    })

})