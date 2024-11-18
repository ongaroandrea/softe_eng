import { beforeEach, describe, test, expect, jest, afterEach, beforeAll } from "@jest/globals"

import express from "express";
import request from "supertest";
import CartRoutes from "../../src/routers/cartRoutes";
import Authenticator from "../../src/routers/auth";
import CartController from "../../src/controllers/cartController";
import ErrorHandler from "../../src/helper";
import { Cart } from "../../src/components/cart";
import {Product, Category} from "../../src/components/product"
import {CartNotFoundError, ProductNotInCartError, EmptyCartError} from "../../src/errors/cartError";
import {ProductNotFoundError, LowProductStockError} from "../../src/errors/productError"
import CartDAO from "../../src/dao/cartDAO";
import { app } from "../../index"

jest.mock("../../src/routers/auth");
jest.mock("../../src/controllers/cartController");

describe("CartRoutes", () => {


    beforeAll(() => {

    });

    beforeEach(() => {
        // Mock des méthodes d'authentification
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            req.isAuthenticated = () => true;
            req.user = { id: "sampleUserId", role: "customer", username: "sampleUser" };
            return next();
        });
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next();
        });

        // Mock des méthodes de CartController
        jest.spyOn(CartController.prototype, "getCart").mockResolvedValue({/* mock cart data */} as Cart);
        jest.spyOn(CartController.prototype, "addToCart").mockResolvedValue(true);
        jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValue(true);
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValue([/* mock cart data */]);
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValue(true);
        jest.spyOn(CartController.prototype, "clearCart").mockResolvedValue(true);
        jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValue(true);
        jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValue([/* mock cart data */]);

        // Mock des méthodes ErrorHandler
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
            return next();
        });

    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    //Get carts
    test("C_ROUTER_01 - GET /carts - get user's cart", async () => {
        const mockCart: Cart = {
            customer: "sampleUser",
            paid: false,
            paymentDate: '',
            total: 2100,
            products: [
                { model: "sampleModel1", quantity: 2, category: Category.SMARTPHONE, price: 300 },
                { model: "sampleModel2", quantity: 1, category: Category.LAPTOP, price: 1500 },
            ]
        };
        jest.spyOn(CartController.prototype, "getCart").mockResolvedValue(mockCart)
        const response = await request(app)
            .get("/ezelectronics/carts");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCart);
    });

    test("C_ROUTER_02 - GET /carts - unauthenticated user", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });

        const response = await request(app)
            .get("/ezelectronics/carts");

        expect(response.status).toBe(401);
    });

    test("C_ROUTER_03 - GET /carts - non-customer user", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 });
        });

        const response = await request(app)
            .get("/ezelectronics/carts");

        expect(response.status).toBe(401);
    });

    //Add to cart
    test("C_ROUTER_04 - POST /carts - add product to cart", async () => {
        const response = await request(app)
            .post("/ezelectronics/carts")
            .send({ model: "sampleModel" });

        expect(response.status).toBe(200);
        expect(CartController.prototype.addToCart).toHaveBeenCalledWith({ id: "sampleUserId", role: "customer", username: "sampleUser" }, "sampleModel");
        
    });

    test("C_ROUTER_05 - POST /carts - missing model parameter", async () => {
        const response = await request(app)
            .post("/ezelectronics/carts")
            .send({});

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty("error");
    });

    test("C_ROUTER_06 - POST /carts - user not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "User not authenticated", status: 401 });
        });

        const response = await request(app)
            .post("/ezelectronics/carts")
            .send({ model: "sampleModel" });

        expect(response.status).toBe(401);
    });

    test("C_ROUTER_07 - POST /carts - user not customer", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "User not customer", status: 401 });
        });

        const response = await request(app)
            .post("/ezelectronics/carts")
            .send({ model: "sampleModel" });

        expect(response.status).toBe(401);
    });

    // Checkout cart
    // PATCH /cart - successful checkout
    test("C_ROUTER_08 - PATCH /carts - successful checkout", async () => {
        const response = await request(app).patch("/ezelectronics/carts");

        expect(response.status).toBe(200);
        expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith({ id: "sampleUserId", role: "customer", username: "sampleUser" });
    });

    // PATCH /cart - user not authenticated
    test("C_ROUTER_09 - PATCH /carts - user not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });

        const response = await request(app).patch("/ezelectronics/carts");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthenticated user");
    });

    // PATCH /cart - user not a customer
    test("C_ROUTER_10 - PATCH /carts - user not a customer", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 });
        });

        const response = await request(app).patch("/ezelectronics/carts");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not a customer");
    });

    // PATCH /cart - cart not found
    test("C_ROUTER_11 - PATCH /carts - cart not found", async () => {
        jest.spyOn(CartDAO.prototype, "CheckExistingCurrentCart").mockImplementation(() => {
            return Promise.resolve(false);
        });
            
        jest.spyOn(CartController.prototype, "checkoutCart").mockImplementationOnce(() => {
            throw new CartNotFoundError();
        });

        const response = await request(app).patch("/ezelectronics/carts");

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Cart not found");
    });

    // PATCH /cart - cart is empty
    test("C_ROUTER_12 - PATCH /carts - cart is empty", async () => {
        jest.spyOn(CartController.prototype, "checkoutCart").mockImplementation(async () => {
            throw new EmptyCartError();
        });

        const response = await request(app).patch("/ezelectronics/carts");

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Cart is empty");
    });

    // PATCH /cart - product not available in required quantity
    test("C_ROUTER_13 - PATCH /carts - product not available in required quantity", async () => {
        jest.spyOn(CartController.prototype, "checkoutCart").mockImplementation(async () => {
            throw new LowProductStockError;
        });

        const response = await request(app).patch("/ezelectronics/carts");

        expect(response.status).toBe(409);
        expect(response.body.error).toBe("Product stock cannot satisfy the requested quantity");
    });


    // Get carts history
    test("C_ROUTER_14 - GET /ezelectronics/carts/history - successfully retrieves cart history", async () => {
        const mockCartHistory = [
            {
                customer: "sampleUser",
                paid: true,
                paymentDate: "2023-03-03",
                total: 2100,
                products: [
                    { model: "sampleModel1", quantity: 2, category: Category.SMARTPHONE, price: 300 },
                    { model: "sampleModel2", quantity: 1, category: Category.LAPTOP, price: 1500 }
                ]
            },
            {
                customer: "sampleUser",
                paid: true,
                paymentDate: "2022-01-01",
                total: 1200,
                products: [
                    { model: "sampleModel3", quantity: 1, category: Category.SMARTPHONE, price: 1200 }
                ]
            }
        ];
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValue(mockCartHistory)

        const response = await request(app).get("/ezelectronics/carts/history");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCartHistory);
        expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledWith({ id: "sampleUserId", role: "customer", username: "sampleUser" });
    });

    test("C_ROUTER_15 - GET /ezelectronics/carts/history - cart history not found", async () => {
        jest.spyOn(CartController.prototype, "getCustomerCarts").mockImplementation(async () => {
            throw new CartNotFoundError();
        });

        const response = await request(app).get("/ezelectronics/carts/history");

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Cart not found");
    });

    test("C_ROUTER_16 - GET /ezelectronics/carts/history - user not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "User is not authenticated", status: 401 });
        });

        const response = await request(app).get("/ezelectronics/carts/history");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not authenticated");
    });

    test("C_ROUTER_17 - GET /ezelectronics/carts/history - user not a customer", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            res.status(401).json({ error: "User is not a customer" });
        });

        const response = await request(app).get("/ezelectronics/carts/history");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not a customer");
    });

    //Delete from Cart

    test("C_ROUTER_18 - DELETE /ezelectronics/carts/products/:model - successfully removes product from cart", async () => {
        const response = await request(app).delete("/ezelectronics/carts/products/sampleModel");

        expect(response.status).toBe(200);
        expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith({ id: "sampleUserId", role: "customer", username: "sampleUser" }, "sampleModel");
    });

    test("C_ROUTER_19 - DELETE /ezelectronics/carts/products/:model - product not in cart", async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockImplementation(async () => {
            throw new ProductNotInCartError();
        });

        const response = await request(app).delete("/ezelectronics/carts/products/sampleModel");

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Product not in cart");
    });

    test("C_ROUTER_20 - DELETE /ezelectronics/carts/products/:model - cart not found", async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockImplementation(async () => {
            throw new CartNotFoundError();
        });

        const response = await request(app).delete("/ezelectronics/carts/products/sampleModel");

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Cart not found");
    });

    test("C_ROUTER_21 - DELETE /ezelectronics/carts/products/:model - product not found", async () => {
        jest.spyOn(CartController.prototype, "removeProductFromCart").mockImplementation(async () => {
            throw new ProductNotFoundError();
        });

        const response = await request(app).delete("/ezelectronics/carts/products/sampleModel");

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Product not found");
    });

    test("C_ROUTER_22 - DELETE /ezelectronics/carts/products/:model - user not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            res.status(401).json({ error: "User is not authenticated" });
        });

        const response = await request(app).delete("/ezelectronics/carts/products/sampleModel");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not authenticated");
    });

    test("C_ROUTER_23 - DELETE /ezelectronics/carts/products/:model - user not a customer", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            res.status(401).json({ error: "User is not a customer" });
        });

        const response = await request(app).delete("/ezelectronics/carts/products/sampleModel");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not a customer");
    });

    //Clear Cart
    test("C_ROUTER_24 - DELETE /ezelectronics/carts/current - successfully clears the cart", async () => {
        const response = await request(app).delete("/ezelectronics/carts/current");

        expect(response.status).toBe(200);
        expect(CartController.prototype.clearCart).toHaveBeenCalledWith({ id: "sampleUserId", role: "customer", username: "sampleUser" });
    });

    test("C_ROUTER_25 - DELETE /ezelectronics/carts/current - cart not found", async () => {
        jest.spyOn(CartController.prototype, "clearCart").mockImplementation(async () => {
            throw new CartNotFoundError();
        });

        const response = await request(app).delete("/ezelectronics/carts/current");

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Cart not found");
    });

    test("C_ROUTER_26 - DELETE /ezelectronics/carts/current - user not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            res.status(401).json({ error: "User is not authenticated" });
        });

        const response = await request(app).delete("/ezelectronics/carts/current");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not authenticated");
    });

    test("C_ROUTER_27 - DELETE /ezelectronics/carts/current - user not a customer", async () => {
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            res.status(401).json({ error: "User is not a customer" });
        });

        const response = await request(app).delete("/ezelectronics/carts/current");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not a customer");
    });

    //Delete all carts
    test("C_ROUTER_28 - DELETE /carts - successfully deletes all carts", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next();
        });
        const response = await request(app).delete("/ezelectronics/carts");

        expect(response.status).toBe(200);
        expect(CartController.prototype.deleteAllCarts).toHaveBeenCalled();
    });

    test("C_ROUTER_29 - DELETE /carts - user not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            res.status(401).json({ error: "User is not authenticated" });
        });

        const response = await request(app).delete("/ezelectronics/carts");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not authenticated");
    });

    test("C_ROUTER_30 - DELETE /carts - user not admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            req.user.role = "customer";
            res.status(401).json({ error: "User is not authorized" });
        });

        const response = await request(app).delete("/ezelectronics/carts");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not authorized");
    });

    //Get All carts
    test("C_ROUTER_31 - GET /ezelectronics/carts/all - successfully retrieves all carts", async () => {
        const mockAllCarts = [
            {
                customer: "sampleUser",
                paid: true,
                paymentDate: "2023-03-03",
                total: 2100,
                products: [
                    { model: "sampleModel1", quantity: 2, category: Category.SMARTPHONE, price: 300 },
                    { model: "sampleModel2", quantity: 1, category: Category.LAPTOP, price: 1500 }
                ]
            },
            {
                customer: "sampleUser2",
                paid: true,
                paymentDate: "2022-01-01",
                total: 1200,
                products: [
                    { model: "sampleModel3", quantity: 1, category: Category.SMARTPHONE, price: 1200 }
                ]
            }
        ];
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next();
        });
        
        jest.spyOn(CartController.prototype, 'getAllCarts').mockResolvedValue(mockAllCarts)

        const response = await request(app).get("/ezelectronics/carts/all");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockAllCarts);
        expect(CartController.prototype.getAllCarts).toHaveBeenCalled();
    });

    test("C_ROUTER_32 - GET /ezelectronics/carts/all - user not authenticated", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            res.status(401).json({ error: "User is not authenticated" });
        });

        const response = await request(app).get("/ezelectronics/carts/all");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not authenticated");
    });

    test("C_ROUTER_33 - GET /ezelectronics/carts/all - user not admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            req.user.role = "customer";
            res.status(401).json({ error: "User is not authorized" });
        });

        const response = await request(app).get("/ezelectronics/carts/all");

        expect(response.status).toBe(401);
        expect(response.body.error).toBe("User is not authorized");
    });
});