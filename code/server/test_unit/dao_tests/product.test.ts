import { afterEach, beforeEach, describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import db from "../../src/db/db"
import ProductDAO from "../../src/dao/productDAO"
import { Category } from "../../src/components/product"
import { DBError } from "../../src/errors/dbError"
import { Cart } from "../../src/components/cart"

jest.mock("../../src/db/db")

describe("PRODUCT DAO", () => {

    let productDAO: ProductDAO

    beforeEach(async () => {
        jest.clearAllMocks()
        productDAO = new ProductDAO()
    })

    afterEach(async () => {
        jest.restoreAllMocks()
    })

    describe("registerProduct", () => {
        test("#P_DAO1 - should call registerProduct in DAO", async () => {
            const product = {
                model: "model",
                category: Category.SMARTPHONE,
                quantity: 10,
                arrivalDate: "2021-01-01",
                sellingPrice: 1000,
                details: "details"
            }

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(null);
                return {} as any;
            });

            await expect(productDAO.registerProducts(product.model, product.category, product.quantity, product.details, product.sellingPrice, product.arrivalDate))
                .resolves
                .toBeUndefined()

            mockDBRun.mockRestore()
        })

        test("#P_DAO2 - should throw Error if registerProduct in DAO throws Error", async () => {
            const product = {
                model: "model",
                category: Category.SMARTPHONE,
                quantity: 10,
                arrivalDate: "2021-01-01",
                sellingPrice: 1000,
                details: "details"
            }

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(new Error());
                return {} as any;
            });

            await expect(productDAO.registerProducts(product.model, product.category, product.quantity, product.details, product.sellingPrice, product.arrivalDate))
                .rejects
                .toThrow(Error)

            mockDBRun.mockRestore()
        })

    })

    describe("changeProductQuantity", () => {
        test("#P_DAO3 - should call changeProductQuantity in DAO", async () => {
            const model = "model"
            const quantity = 10

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(null);
                return {} as any;
            })

            await expect(productDAO.changeProductQuantity(model, quantity, null))
                .resolves
                .toBe(quantity)

            mockDBRun.mockRestore()
        })

        test("#P_DAO4 - should throw Error if changeProductQuantity in DAO throws Error", async () => {
            const model = "model"
            const quantity = 10

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(new Error());
                return {} as any;
            })

            await expect(productDAO.changeProductQuantity(model, quantity, null))
                .rejects
                .toThrow(Error)

            mockDBRun.mockRestore()
        })
    })

    describe("sellProduct", () => {
        test("#P_DAO5 - should call sellProduct in DAO", async () => {
            const model = "model"
            const quantity = 10

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(null);
                return {} as any;
            })

            await expect(productDAO.sellProduct(model, quantity, null))
                .resolves
                .toBe(quantity)

            mockDBRun.mockRestore()
        })

        test("#P_DAO6 - should throw Error if sellProduct in DAO throws Error", async () => {
            const model = "model"
            const quantity = 10

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(new Error());
                return {} as any;
            })

            await expect(productDAO.sellProduct(model, quantity, null))
                .rejects
                .toThrow(Error)

            mockDBRun.mockRestore()
        })
    })

    describe("getProducts", () => {
        const products = [
            {
                model: "model1",
                category: Category.SMARTPHONE,
                quantity: 10,
                arrivalDate: "2021-01-01",
                sellingPrice: 1000,
                details: "details"
            },
            {
                model: "model2",
                category: Category.LAPTOP,
                quantity: 20,
                arrivalDate: "2021-01-02",
                sellingPrice: 2000,
                details: "details"
            },
            {
                model: "model3",
                category: Category.SMARTPHONE,
                quantity: 0,
                arrivalDate: "2021-01-03",
                sellingPrice: 3000,
                details: "details"
            }
        ]

        test("#P_DAO7 - No parameters", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, callback: any) => {
                //return all products
                return callback(null, products);
            });

            const result = await productDAO.getProducts(null, null, null, false);
            expect(mockDBAll).toHaveBeenCalledWith("SELECT * FROM product", expect.any(Function))
            expect(result).toEqual(products);
        });

        test("#P_DAO8 - Category smartphone", async () => {

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, callback: any) => {
                callback(null, [products[0]]);
                return {} as any;
            })

            const result = await productDAO.getProducts("category", Category.SMARTPHONE, null, false)
            expect(mockDBAll).toHaveBeenCalledWith("SELECT * FROM product WHERE category = 'Smartphone'", expect.any(Function))
            expect(result).toEqual([products[0]])
            mockDBAll.mockRestore()
        })

        test("#P_DAO9 - Category laptop", async () => {

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, callback: any) => {
                callback(null, [products[1]]);
                return {} as any;
            })

            const result = await productDAO.getProducts("category", Category.LAPTOP, null, false)
            expect(mockDBAll).toHaveBeenCalledWith("SELECT * FROM product WHERE category = 'Laptop'", expect.any(Function))
            expect(result).toEqual([products[1]])
            mockDBAll.mockRestore()
        })

        test("#P_DAO10 - Model model1", async () => {

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, callback: any) => {
                callback(null, [products[0]]);
                return {} as any;
            })

            const result = await productDAO.getProducts("model", null, "model1", false)
            expect(mockDBAll).toHaveBeenCalledWith("SELECT * FROM product WHERE model = 'model1'", expect.any(Function))
            expect(result).toEqual([products[0]])

            mockDBAll.mockRestore()
        })

        test("#P_DAO11 - Get only available products", async () => {

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, callback: any) => {
                callback(null, [products[0], products[1]]);
                return {} as any;
            })

            const result = await productDAO.getProducts(null, null, null, true)
            expect(mockDBAll).toHaveBeenCalledWith("SELECT * FROM product WHERE quantity > 0", expect.any(Function))
            expect(result).toEqual([products[0], products[1]])

            mockDBAll.mockRestore()
        })

        test("#P_DAO12 - Get only available products with category smartphone", async () => {

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, callback: any) => {
                callback(null, [products[0]]);
                return {} as any;
            })

            const result = await productDAO.getProducts("category", Category.SMARTPHONE, null, true)
            expect(mockDBAll).toHaveBeenCalledWith("SELECT * FROM product WHERE quantity > 0 AND category = 'Smartphone'", expect.any(Function))
            expect(result).toEqual([products[0]])

            mockDBAll.mockRestore()
        })

        test("#P_DAO13 - Get only available products with model model1", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, callback: any) => {
                callback(null, [products[0]]);
                return {} as any;
            })
            const result = await productDAO.getProducts("model", null, "model1", true)
            expect(mockDBAll).toHaveBeenCalledWith("SELECT * FROM product WHERE quantity > 0 AND model = 'model1'", expect.any(Function))
            expect(result).toEqual([products[0]])

            mockDBAll.mockRestore()
        })

        test("#P_DAO14 - should throw Error if getProducts in DAO throws Error", async () => {

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, callback: any) => {
                callback(new Error());
                return {} as any;
            })

            await expect(productDAO.getProducts(null, null, null, false))
                .rejects
                .toThrow(Error)

            mockDBAll.mockRestore()
        })

        test("#P_DAO15 - should throw DBError if getProducts in DAO throws DBError", async () => {

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, callback: any) => {
                callback(new DBError());
                return {} as any;
            })

            await expect(productDAO.getProducts(null, null, null, false))
                .rejects
                .toThrow(DBError)

            mockDBAll.mockRestore()
        })
    })

    describe("deleteAllProducts", () => {
        test("#P_DAO16 - should call deleteProducts in DAO", async () => {
            const model = "model"

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, callback: any) => {
                callback(null);
                return {} as any;
            })

            await expect(productDAO.deleteAllProducts())
                .resolves
                .toBe(true)

            mockDBRun.mockRestore()
        })

        test("#P_DAO17 - should throw Error if deleteProducts in DAO throws Error", async () => {

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, callback: any) => {
                callback(new Error());
                return {} as any;
            })

            await expect(productDAO.deleteAllProducts())
                .rejects
                .toThrow(Error)

            mockDBRun.mockRestore()
        })
    })

    describe("deleteProductByModel", () => {
        test("#P_DAO18 - should call deleteProductByModel in DAO", async () => {
            const model = "model"

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(null);
                return {} as any;
            })

            await expect(productDAO.deleteProduct(model))
                .resolves
                .toBe(true)

            mockDBRun.mockRestore()
        })

        test("#P_DAO19 - should throw Error if deleteProductByModel in DAO throws Error", async () => {
            const model = "model"

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(new Error());
                return {} as any;
            })

            await expect(productDAO.deleteProduct(model))
                .rejects
                .toThrow(Error)

            mockDBRun.mockRestore()
        })
    })

    describe("Cover rejects in every function", () => {

        // This is a statement coverage test - not a path coverage test
        test("#P_DAO21 - should throw Error if getProductByModel in DAO throws Error", async () => {
            const errorMessage = 'Some error';
            jest.spyOn(db, 'run').mockImplementation(() => {
                throw new Error(errorMessage);
            });

            jest.spyOn(db, 'get').mockImplementation(() => {
                throw new Error(errorMessage);
            });            

            jest.spyOn(db, 'all').mockImplementation(() => {
                throw new Error(errorMessage);
            })

            await expect(productDAO.getProductByModel("model")).rejects.toThrow(Error)

            await expect(productDAO.getProductsOfCart(new Cart("", false, "X", 43, []))).rejects.toThrow(Error)

            
            await expect(productDAO.registerProducts("model", Category.SMARTPHONE, 10, "details", 1000, "2021-01-01"))
                .rejects
                .toThrow(Error)

            await expect(productDAO.changeProductQuantity("model", 10, null)).rejects.toThrow(Error)

            await expect(productDAO.sellProduct("model", 10, null)).rejects.toThrow(Error)

            await expect(productDAO.getProducts(null, null, null, false)).rejects.toThrow(Error)

            await expect(productDAO.deleteAllProducts()).rejects.toThrow(Error)

            await expect(productDAO.deleteProduct("model")).rejects.toThrow(Error)
        })
    })

    test("#P_DAO20 - should call getProductByModel in DAO", async () => {
        const model = "model"

        const product = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 10,
            arrivalDate: "2021-01-01",
            sellingPrice: 1000,
            details: "details"
        }

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(null, product);
            return {} as any;
        })

        await expect(productDAO.getProductByModel(model))
            .resolves
            .toEqual(product)

        mockDBGet.mockRestore()
    })
})
