import { describe, test, expect, jest, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals"
import ProductController from "../../src/controllers/productController"
import ProductDAO from "../../src/dao/productDAO";
import { ArrivalDateNotValidError, GroupingNotValidError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError";
import { Category, Product } from "../../src/components/product";

jest.mock("../../src/dao/productDAO")

describe("ProductController", () => {

    let productController: ProductController

    beforeEach(() => {
        jest.clearAllMocks()
        productController = new ProductController()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe("registerProduct", () => {

        test("P_CONTROLLER_01 - SUCCESS", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValue()
            await expect(productController.registerProducts(testProduct.model,
                testProduct.category,
                testProduct.quantity,
                null,
                testProduct.sellingPrice,
                testProduct.arrivalDate
            )).resolves.toBeUndefined()
        })

        test("P_CONTROLLER_02 - SUCCESS - ARRIVAL DATE NULL", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                quantity: 10,
                sellingPrice: 100,
            }

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            jest.spyOn(ProductDAO.prototype, "registerProducts").mockResolvedValue()

            await expect(productController.registerProducts(testProduct.model,
                testProduct.category,
                testProduct.quantity,
                null,
                testProduct.sellingPrice,
                null
            )).resolves.toBeUndefined()
        })

        test("P_CONTROLLER_03 - PRODUCT ALREADY EXIST", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(testProduct.sellingPrice, testProduct.model, Category.SMARTPHONE, testProduct.arrivalDate, null, testProduct.quantity))

            await expect(productController.registerProducts(testProduct.model,
                testProduct.category,
                testProduct.quantity,
                null,
                testProduct.sellingPrice,
                testProduct.arrivalDate
            )).rejects.toThrow(new ProductAlreadyExistsError())
        })

        test("P_CONTROLLER_04 - INVALID DATE", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            jest.spyOn(ProductController.prototype, "invalidDate").mockImplementation(() => true)

            await expect(productController.registerProducts(testProduct.model,
                testProduct.category,
                testProduct.quantity,
                null,
                testProduct.sellingPrice,
                "2021-12-12"
            )).rejects.toThrow(new ArrivalDateNotValidError())
        })

        test("P_CONTROLLER_04_1 - INVALID DATE", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(new Product(testProduct.sellingPrice, testProduct.model, Category.SMARTPHONE, testProduct.arrivalDate, null, testProduct.quantity));
            jest.spyOn(ProductDAO.prototype, 'registerProducts').mockResolvedValue(); // Mock the implementation if needed
            jest.spyOn(ProductController.prototype, 'invalidDate').mockImplementation(() => true);

            const model = "existingModel";
            const category = "category1";
            const quantity = 5;
            const details = "details1";
            const sellingPrice = 100;
            const arrivalDate = "2023-06-01";

            await expect(productController.registerProducts(model, category, quantity, details, sellingPrice, arrivalDate))
                .rejects.toThrow(ProductAlreadyExistsError);
        })

    })

    describe("changeProductQuantity", () => {

        beforeEach(() => {
            jest.clearAllMocks()
            productController = new ProductController()
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        test("P_CONTROLLER_05 - SUCCESS", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }
            const product = new Product(testProduct.sellingPrice, testProduct.model, Category.SMARTPHONE, testProduct.arrivalDate, null, testProduct.quantity);

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product)
            jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValue(20)

            await expect(productController.changeProductQuantity(testProduct.model, testProduct.quantity, null)).resolves.toBe(20)

        })

        test("P_CONTROLLER_06 - PRODUCT NOT FOUND", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)

            await expect(productController.changeProductQuantity(testProduct.model, 10, null)).rejects.toThrow(new ProductNotFoundError())
        })

        test("P_CONTROLLER_07 - INVALID DATE", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            jest.spyOn(ProductController.prototype, "invalidDate").mockImplementationOnce(() => false)

            await expect(productController.changeProductQuantity(testProduct.model, 10, "2021-12-12")).rejects.toThrow(new ArrivalDateNotValidError())
        })


        test("P_CONTROLLER_07_1 - INVALID DATE", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            jest.spyOn(ProductDAO.prototype, 'getProductByModel').mockResolvedValue(new Product(testProduct.sellingPrice, testProduct.model, Category.SMARTPHONE, testProduct.arrivalDate, null, testProduct.quantity));
            jest.spyOn(ProductDAO.prototype, 'changeProductQuantity').mockResolvedValue(20); // Mock the implementation if needed

            await expect(productController.changeProductQuantity(testProduct.model,
                testProduct.quantity,
                "2021-12-12"
            )).rejects.toThrow(new ArrivalDateNotValidError())
        })


        test("P_CONTROLLER_08 - DATE BEFORE ARRIVAL DATE", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            const product = new Product(testProduct.sellingPrice, testProduct.model, Category.SMARTPHONE, testProduct.arrivalDate, null, testProduct.quantity);

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product)
            jest.spyOn(ProductController.prototype, "invalidDate").mockImplementationOnce(() => true)

            await expect(productController.changeProductQuantity(testProduct.model, 10, "2021-12-12")).rejects.toThrow(new ArrivalDateNotValidError())

        })
    })

    describe("sellProduct", () => {
        test("P_CONTROLLER_09 - SUCCESS", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            const product = new Product(testProduct.sellingPrice, testProduct.model, Category.SMARTPHONE, testProduct.arrivalDate, null, testProduct.quantity);

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product)
            jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValue(5)

            await expect(productController.sellProduct(testProduct.model, 5, null)).resolves.toBe(5)
        })

        test("P_CONTROLLER_10 - PRODUCT NOT FOUND", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)

            await expect(productController.sellProduct(testProduct.model, 5, null)).rejects.toThrow(new ProductNotFoundError())
        })

        test("P_CONTROLLER_11 - INVALID DATE", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            jest.spyOn(ProductController.prototype, "invalidDate").mockImplementationOnce(() => false)

            await expect(productController.sellProduct(testProduct.model, 5, "2021-12-12")).rejects.toThrow(new ArrivalDateNotValidError())
        })

        test("P_CONTROLLER_12 - DATE BEFORE SELLING DATE", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            const product = new Product(testProduct.sellingPrice, testProduct.model, Category.SMARTPHONE, testProduct.arrivalDate, null, testProduct.quantity);

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product)
            jest.spyOn(ProductController.prototype, "invalidDate").mockImplementationOnce(() => false)

            await expect(productController.sellProduct(testProduct.model, 5, "2021-12-12")).rejects.toThrow(new ArrivalDateNotValidError())
        })

        test("P_CONTROLLER_13 - QUANTITY EXCEEDS AVAILABLE", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 10,
                sellingPrice: 100,
            }

            const product = new Product(testProduct.sellingPrice, testProduct.model, Category.SMARTPHONE, testProduct.arrivalDate, null, testProduct.quantity);

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product)

            await expect(productController.sellProduct(testProduct.model, 15, null)).rejects.toThrow(new LowProductStockError())
        })

        test("P_CONTROLLER_14 - QUANTITY PRODUCT EQUAL TO 0", async () => {
            const testProduct = {
                model: "test_model",
                category: "test_category",
                arrivalDate: "2022-12-12",
                quantity: 0,
                sellingPrice: 100,
            }

            const product = new Product(testProduct.sellingPrice, testProduct.model, Category.SMARTPHONE, testProduct.arrivalDate, null, testProduct.quantity);

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product)

            await expect(productController.sellProduct(testProduct.model, 5, null)).rejects.toThrow(new LowProductStockError())

        })
    })

    describe("getProducts", () => {

        const testProducts = [
            new Product(100, "model1", Category.SMARTPHONE, "2022-12-12", null, 10),
            new Product(200, "model2", Category.LAPTOP, "2022-12-12", null, 10),
            new Product(300, "model3", Category.APPLIANCE, "2022-12-12", null, 10)
        ]

        test("P_CONTROLLER_15 - SUCCESS", async () => {
            jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue(testProducts)
            await expect(productController.getProducts(null, null, null)).resolves.toEqual(testProducts)
        })

        test("P_CONTROLLER_16 - SUCCESS - GROUPING BY CATEGORY", async () => {
            jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([testProducts[0]])
            await expect(productController.getProducts("category", "Smartphone", null)).resolves.toEqual([testProducts[0]])
        })

        test("P_CONTROLLER_17 - INVALID GROUPING - GROUPING NULL AND CATEGORY NOT NULL", async () => {
            jest.spyOn(ProductController.prototype, "checkGrouping").mockImplementationOnce(() => {
                throw new GroupingNotValidError()
            })
            await expect(productController.getProducts(null, "Smartphone", null)).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_18 - INVALID GROUPING - GROUPING NULL AND MODEL NOT NULL", async () => {
            jest.spyOn(ProductController.prototype, "checkGrouping").mockImplementationOnce(() => {
                throw new GroupingNotValidError()
            })
            await expect(productController.getProducts(null, null, "model1")).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_19 - INVALID GROUPING - GROUPING MODEL AND CATEGORY NOT NULL", async () => {
            jest.spyOn(ProductController.prototype, "checkGrouping").mockImplementationOnce(() => {
                throw new GroupingNotValidError()
            })
            await expect(productController.getProducts("model", "Smartphone", null)).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_20 - INVALID GROUPING - GROUPING MODEL AND MODEL NULL", async () => {
            jest.spyOn(ProductController.prototype, "checkGrouping").mockImplementationOnce(() => {
                throw new GroupingNotValidError()
            })
            await expect(productController.getProducts("model", null, null)).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_21 - INVALID GROUPING - GROUPING CATEGORY AND MODEL NOT NULL", async () => {
            jest.spyOn(ProductController.prototype, "checkGrouping").mockImplementationOnce(() => {
                throw new GroupingNotValidError()
            })
            await expect(productController.getProducts("category", null, "model1")).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_22 - INVALID GROUPING - GROUPING CATEGORY AND CATEGORY NULL", async () => {
            jest.spyOn(ProductController.prototype, "checkGrouping").mockImplementationOnce(() => {
                throw new GroupingNotValidError()
            })
            await expect(productController.getProducts("category", null, null)).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_23 - INVALID CATEGORY", async () => {
            jest.spyOn(ProductController.prototype, "checkGrouping").mockImplementationOnce(() => {
                throw new GroupingNotValidError()
            })
            await expect(productController.getProducts("category", "test_category", null)).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_24 - INVALID MODEL - MODEL NOT FOUND", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            expect(productController.checkGrouping("model", null, "test_model")).rejects.toThrow(new ProductNotFoundError())
        })
    })

    describe("getAvailableProducts", () => {
        test("P_CONTROLLER_25 - SUCCESS", async () => {
            jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([new Product(100, "model1", Category.SMARTPHONE, "2022-12-12", null, 10)])
            await expect(productController.getAvailableProducts(null, null, null)).resolves.toEqual([new Product(100, "model1", Category.SMARTPHONE, "2022-12-12", null, 10)])
        })

        test("P_CONTROLLER_26 - INVALID GROUPING - GROUPING NULL AND CATEGORY NOT NULL", async () => {
            jest.spyOn(ProductController.prototype, "checkGrouping").mockImplementationOnce(() => {
                throw new GroupingNotValidError()
            })
            await expect(productController.getAvailableProducts(null, "Smartphone", null)).rejects.toThrow(new GroupingNotValidError())
        })
    })

    describe("deleteAllProducts", () => {
        test("P_CONTROLLER_27 - SUCCESS", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValue(true)
            await expect(productController.deleteAllProducts()).resolves.toBe(true)
        })
    })

    describe("deleteProduct", () => {
        test("P_CONTROLLER_28 - SUCCESS", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(100, "model1", Category.SMARTPHONE, "2022-12-12", null, 10))
            jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValue(true)

            await expect(productController.deleteProduct("model1")).resolves.toBe(true)
        })

        test("P_CONTROLLER_29 - PRODUCT NOT FOUND", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            await expect(productController.deleteProduct("model1")).rejects.toThrow(new ProductNotFoundError())
        })
    })

    describe("checkGrouping", () => {

        const testProducts = [
            new Product(100, "model1", Category.SMARTPHONE, "2022-12-12", null, 10),
            new Product(200, "model2", Category.LAPTOP, "2022-12-12", null, 10),
            new Product(300, "model3", Category.APPLIANCE, "2022-12-12", null, 10)
        ]

        test("P_CONTROLLER_30 - SUCCESS - GROUPING BY CATEGORY", async () => {
            await expect(productController.checkGrouping("category", "Smartphone", null)).resolves.toBeUndefined()
        })

        test("P_CONTROLLER_31 - INVALID GROUPING - GROUPING CATEGORY AND MODEL NOT NULL", async () => {
            await expect(productController.checkGrouping("category", null, "model1")).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_32 - INVALID GROUPING - GROUPING CATEGORY AND CATEGORY NULL", async () => {
            await expect(productController.checkGrouping("category", null, null)).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_33 - SUCCESS - GROUPING BY MODEL", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(new Product(100, "model1", Category.SMARTPHONE, "2022-12-12", null, 10))
            await expect(productController.checkGrouping("model", null, "model1")).resolves.toBeUndefined()
        })

        test("P_CONTROLLER_34 - INVALID GROUPING - GROUPING NULL AND CATEGORY NOT NULL", async () => {
            await expect(productController.checkGrouping(null, "Smartphone", null)).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_35 - INVALID GROUPING - GROUPING NULL AND MODEL NOT NULL", async () => {
            await expect(productController.checkGrouping(null, null, "model1")).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_36 - INVALID GROUPING - GROUPING MODEL AND CATEGORY NOT NULL", async () => {
            await expect(productController.checkGrouping("model", "Smartphone", null)).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_37 - INVALID GROUPING - GROUPING MODEL AND MODEL NULL", async () => {
            await expect(productController.checkGrouping("model", null, null)).rejects.toThrow(new GroupingNotValidError())
        })

        test("P_CONTROLLER_39 - INVALID MODEL - MODEL NOT FOUND", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null)
            await expect(productController.checkGrouping("model", null, "test_model")).rejects.toThrow(new ProductNotFoundError())
        })


    })


    describe('invalidDate', () => {
        test('P_CONTROLLER_40 - should return false for valid date', () => {
            const date = '2023-06-01';

            expect(productController.invalidDate(date)).toBe(false);
        });

        test('P_CONTROLLER_41 - should return true for date after current date', () => {
            const date = '2026-06-10';
            expect(productController.invalidDate(date)).toBe(true);
        });
    });
})