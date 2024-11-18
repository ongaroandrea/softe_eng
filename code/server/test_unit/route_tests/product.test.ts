import { beforeEach, describe, test, expect, jest, afterEach, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import ProductController from "../../src/controllers/productController"
import Authenticator from "../../src/routers/auth"
import { Category, Product } from "../../src/components/product"
import { ArrivalDateNotValidError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"
const baseURL = "/ezelectronics/products"

jest.mock("../../src/routers/auth")
jest.mock("../../src/controllers/productController")

describe("POST REGISTER_ARRIVAL", () => {

    beforeEach(async () => {
        jest.clearAllMocks()
    })

    afterAll(() => {
        jest.restoreAllMocks()
    })

    const testProduct = { //Define a test product object sent to the route
        model: "test",
        category: "Smartphone",
        quantity: 1,
        details: "test",
        sellingPrice: 1000,
        arrivalDate: "2022-12-31"
    }


    test("P_ROUTER_01 - 401 error code - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).post(baseURL).send(testProduct) //Send a POST request to the route
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_02 - 401 error code - no admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).post(baseURL).send(testProduct) //Send a POST request to the route
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_03 - 200 code - all data inserted", async () => {

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            req.isAuthenticated = () => true
            req.user = { id: "sampleUserId", role: "customer", username: "sampleUser" }
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL).send(testProduct)
        expect(response.status).toBe(200)

        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model,
            testProduct.category,
            testProduct.quantity,
            testProduct.details,
            testProduct.sellingPrice,
            testProduct.arrivalDate)


    })

    test("P_ROUTER_10 - 409 code - model already exists", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "registerProducts").mockImplementationOnce(() => {
            throw new ProductAlreadyExistsError();
        })
        const response = await request(app).post(baseURL).send(testProduct)
        expect(response.status).toBe(409)
    })


    test("P_ROUTER_04 - 200 code - no arrivalDate", async () => {
        const testProduct = { //Define a test product object sent to the route
            model: "test",
            category: "Smartphone",
            quantity: 1,
            details: "test",
            sellingPrice: 1000
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL).send(testProduct)
        expect(response.status).toBe(200)

        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(testProduct.model,
            testProduct.category,
            testProduct.quantity,
            testProduct.details,
            testProduct.sellingPrice,
            undefined
        )
    })

    test("P_ROUTER_05 - 422 code - missing model", async () => {
        const testProduct = { //Define a test product object sent to the route
            category: "Smartphone",
            quantity: 1,
            details: "test",
            sellingPrice: 1000,
            arrivalDate: "2022-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "registerProducts")
        const response = await request(app).post(baseURL).send(testProduct)
        expect(response.status).toBe(422)

    })

    test("P_ROUTER_06 - 422 code - missing category", async () => {
        const testProduct = { //Define a test product object sent to the route
            model: "test",
            quantity: 1,
            details: "test",
            sellingPrice: 1000,
            arrivalDate: "2022-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL).send(testProduct)
        expect(response.status).toBe(422)

    })

    test("P_ROUTER_07 - 422 code - missing quantity", async () => {
        const testProduct = { //Define a test product object sent to the route
            model: "test",
            category: "Smartphone",
            details: "test",
            sellingPrice: 1000,
            arrivalDate: "2022-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL).send(testProduct)
        expect(response.status).toBe(422)

    })

    test("P_ROUTER_08 - 422 code - missing sellingPrice", async () => {
        const testProduct = { //Define a test product object sent to the route
            model: "test",
            category: "Smartphone",
            quantity: 1,
            details: "test",
            arrivalDate: "2022-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL).send(testProduct)
        expect(response.status).toBe(422)

    })

    test("P_ROUTER_09 - 422 code - invalid category", async () => {
        const testProduct = { //Define a test product object sent to the route
            model: "test",
            category: "Error",
            quantity: 1,
            details: "test",
            sellingPrice: 1000,
            arrivalDate: "2022-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL).send(testProduct)
        expect(response.status).toBe(422)

    })



    test("P_ROUTER_11 - 422 code - invalid arrivalDate", async () => {
        const testProduct = { //Define a test product object sent to the route
            model: "test",
            category: "Smartphone",
            quantity: 1,
            details: "test",
            sellingPrice: 1000,
            arrivalDate: "Error"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()
        const response = await request(app).post(baseURL).send(testProduct)
        expect(response.status).toBe(422)
    })
})

describe("PATCH CHANGE_QUANTITY", () => {

    const testProduct = { //Define a test product object sent to the route
        model: "test",
        quantity: 1,
        changeDate: "2022-12-31"
    }

    beforeEach(async () => {
        jest.clearAllMocks()
        await request(app).post(baseURL).send(testProduct)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test("P_ROUTER_22 - 400 code - date is before arrival date", async () => {
        const testProductBeforeDate = { //Define a test product object sent to the route
            quantity: 1,
            changeDate: "2022-12-30"
        }

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockImplementationOnce(() => {
            throw new ArrivalDateNotValidError();
        })

        const response = await request(app).patch(baseURL + "/" + testProduct.model).send(testProductBeforeDate)
        expect(response.status).toBe(400)
    })

    test("P_ROUTER_21 - 400 code - date in the future", async () => {
        const testProductNoDate = { //Define a test product object sent to the route
            quantity: 19999,
            changeDate: "2026-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(
            new ArrivalDateNotValidError()
        )

        const response = await request(app).patch(baseURL + "/" + "test").send(testProductNoDate)
        expect(response.status).toBe(400)
    })

    test("P_ROUTER_12 - 401 error code - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).patch(baseURL + "/" + testProduct.model).send(testProduct)
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_13 - 401 error code - no admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).patch(baseURL + "/" + testProduct.model).send(testProduct)
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_14 - 200 code - all data inserted", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(2)

        //first add the product
        const response_quantity = await request(app).patch(baseURL + "/" + testProduct.model).send(testProduct)
        expect(response_quantity.status).toBe(200)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testProduct.model,
            testProduct.quantity,
            testProduct.changeDate)
    })

    test("P_ROUTER_15 - 200 code - no change date", async () => {
        //remove the change date from the test product
        const testProductNoDate = { //Define a test product object sent to the route
            model: "test",
            quantity: 1
        }

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockImplementationOnce(() => {
            return Promise.resolve(2)
        })
        const response_quantity = await request(app).patch(baseURL + "/" + testProduct.model).send(testProductNoDate)
        expect(response_quantity.status).toBe(200)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(testProduct.model,
            testProduct.quantity,
            undefined)
        expect(response_quantity.body.quantity).toBe(2)

    })

    test("P_ROUTER_16 - 404 code - model not found", async () => {
        const testProduct = { //Define a test product object sent to the route
            model: "test_error",
            quantity: 1,
            changeDate: "2022-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockImplementationOnce(() => {
            throw new ProductNotFoundError();
        })
        const response = await request(app).patch(baseURL + "/" + testProduct.model).send(testProduct)
        expect(response.status).toBe(404)
    })


    test("P_ROUTER_17 - 422 code - missing model", async () => {
        const testNoModelProduct = { //Define a test product object sent to the route
            quantity: 1,
            changeDate: "2022-12-31"
        }

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(2)

        const response = await request(app).patch(baseURL + "/").send(testNoModelProduct)
        expect(response.status).toBe(404)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)
    })

    test("P_ROUTER_18 - 422 code - missing quantity", async () => {
        const testProductNoQuantity = { //Define a test product object sent to the route
            changeDate: "2022-12-31"
        }

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(2)

        const response = await request(app).patch(baseURL + "/" + testProduct.model).send(testProductNoQuantity)
        expect(response.status).toBe(422)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)
    })

    test("P_ROUTER_19 - 422 code - invalid quantity", async () => {
        const testProductNegativeQuantity = { //Define a test product object sent to the route
            quantity: -1,
            changeDate: "2022-12-31"
        }

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(2)

        const response = await request(app).patch(baseURL + "/" + testProduct.model).send(testProductNegativeQuantity)
        expect(response.status).toBe(422)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)
    })

    test("P_ROUTER_20 - 422 code - invalid changeDate", async () => {
        const testProductErrorDate = { //Define a test product object sent to the route
            quantity: 1,
            changeDate: "Error"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).patch(baseURL + "/" + testProduct.model).send(testProductErrorDate)
        expect(response.status).toBe(422)
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)
    })

    test("P_ROUTER_20_s - 400 code - invalid changeDate", async () => {

        jest.resetAllMocks()
        const testProductErrorDate = { //Define a test product object sent to the route
            quantity: 1,
            changeDate: "2026-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockImplementationOnce(() => {
            throw new ArrivalDateNotValidError();
        })

        const response = await request(app).patch(baseURL + "/" + testProduct.model).send(testProductErrorDate)
        expect(response.status).toBe(400)
    })


})

describe("PATCH SELL_PRODUCT", () => {

    const testProduct = { //Define a test product object sent to the route
        model: "test",
        quantity: 1,
        sellingDate: "2022-12-31"

    }

    const zeroProduct = { //Define a test product object sent to the route
        model: "zero",
        quantity: 0,
        sellingDate: "2022-12-31"
    }

    const sellingDateProduct = { //Define a test product object sent to the route
        model: "test",
        quantity: 1,
        sellingDate: "2023-12-31"
    }

    const additionalUrl = "sell"
    beforeEach(async () => {
        jest.clearAllMocks()
        //add a new product 
        await request(app).post(baseURL).send(testProduct)
        await request(app).post(baseURL).send(zeroProduct)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test("P_ROUTER_23 - 401 error code - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).patch(baseURL + "/" + testProduct.model + "/" + additionalUrl).send(testProduct)
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_24 - 401 error code - no admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).patch(baseURL + "/" + testProduct.model + "/" + additionalUrl).send(testProduct)
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_25 - 200 code - all data inserted", async () => {
        const testProduct = { //Define a test product object sent to the route
            model: "test",
            quantity: 1,
            sellingDate: "2022-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(1)
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).patch(baseURL + "/" + testProduct.model + "/" + additionalUrl).send(testProduct)
        expect(response.status).toBe(200)
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testProduct.model,
            testProduct.quantity,
            testProduct.sellingDate)
    })

    test("P_ROUTER_26 - 404 code - model not found", async () => {
        const testProduct = { //Define a test product object sent to the route
            model: "Error",
            quantity: 1,
            sellingDate: "2022-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "sellProduct").mockImplementationOnce(() => {
            throw new ProductNotFoundError();
        })

        const response = await request(app).patch(baseURL + "/" + testProduct.model + "/" + additionalUrl).send(testProduct)
        expect(response.status).toBe(404)
    })

    test("P_ROUTER_27 - 400 code - sellingDate is after the current date", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "sellProduct").mockImplementationOnce(() => {
            throw new ArrivalDateNotValidError();
        })


        const response = await request(app).patch(baseURL + "/" + testProduct.model + "/" + additionalUrl).send(sellingDateProduct)
        expect(response.status).toBe(400)
    })

    test("P_ROUTER_28 - 400 code - sellingDate is before the arrival date", async () => {
        const sellingDateBeforeroduct = { //Define a test product object sent to the route
            model: "test",
            quantity: 1,
            sellingDate: "2022-12-30"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "sellProduct").mockImplementationOnce(() => {
            throw new ArrivalDateNotValidError();
        })


        const response = await request(app).patch(baseURL + "/" + testProduct.model + "/" + additionalUrl).send(sellingDateBeforeroduct)
        expect(response.status).toBe(400)
    })

    test("P_ROUTER_29 - 409 code - availability quantity equal to 0", async () => {
        const zeroAvailabilityProduct = { //Define a test product object sent to the route
            model: "zero",
            quantity: 1,
            sellingDate: "2022-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "sellProduct").mockImplementationOnce(() => {
            throw new LowProductStockError();
        })


        const response = await request(app).patch(baseURL + "/" + zeroProduct.model + "/" + additionalUrl).send(zeroAvailabilityProduct)
        expect(response.status).toBe(409) 
    })

    test("P_ROUTER_30 - 409 code - quantity to sell is greater than availability", async () => {
        const testProduct = { 
            model: "test",
            quantity: 20,
            sellingDate: "2022-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "sellProduct").mockImplementationOnce(() => {
            throw new LowProductStockError();
        })
        const response = await request(app).patch(baseURL + "/" + testProduct.model + "/" + additionalUrl).send(testProduct)
        expect(response.status).toBe(409)
    })

    test("P_ROUTER_31 - 503 code - missing model - it's not possible to have 422", async () => {
        const testProductNoModel = { //Define a test product object sent to the route
            quantity: 1,
            sellingDate: "2022-12-31"
        }

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        let url = baseURL + "/" + " " + "/" + additionalUrl
        const response = await request(app).patch(url).send(testProductNoModel)
        expect(response.status).toBe(503)
    })

    test("P_ROUTER_32 - 422 code - missing quantity", async () => {
        const testProduct = { //Define a test product object sent to the route
            model: "test",
            sellingDate: "2022-12-31"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        const response = await request(app).patch(baseURL + "/" + testProduct.model + "/" + additionalUrl).send(testProduct)
        expect(response.status).toBe(422)
    })
})

describe("GET - FILTER_PRODUCTS", () => {

    test("P_ROUTER_33 - 401 error code - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).get(baseURL)
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_34 - 401 error code - no admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).get(baseURL)
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_35 - Get empty array of products - 200 success code", async () => {

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([])
        const response = await request(app).get(baseURL)
        expect(response.status).toBe(200)
        expect(ProductController.prototype.getProducts).toHaveBeenCalled()
        expect(response.body).toEqual([])

    })

    test("P_ROUTER_36 - Get all the products - 200 success code", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([{
            model: "test",
            category: Category.SMARTPHONE,
            quantity: 1,
            details: "test",
            sellingPrice: 1000,
            arrivalDate: "2022-12-31"
        }])


        const response = await request(app).get(baseURL)
        expect(response.status).toBe(200)
        expect(ProductController.prototype.getProducts).toHaveBeenCalled()
        expect(response.body).toEqual([{
            model: "test",
            category: "Smartphone",
            quantity: 1,
            details: "test",
            sellingPrice: 1000,
            arrivalDate: "2022-12-31"
        }])
    })

    test("P_ROUTER_37 - Get all the products - 200 success code", async () => {
        const smartphonetest = new Product(43,"smartphonetest", Category.SMARTPHONE,  "2022-12-31", "", 2);
        const smartphonetest2 = new Product(44,"smartphonetest2", Category.SMARTPHONE,  "2022-12-31", "", 2);

        const laptopTest = new Product(45,"laptopTest", Category.LAPTOP,  "2022-12-31", "", 2);

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([
            smartphonetest,
            smartphonetest2,
            laptopTest
        ])

        const response = await request(app).get(baseURL)
        expect(response.status).toBe(200)
        expect(ProductController.prototype.getProducts).toHaveBeenCalled()
        expect(response.body).toEqual([
            {
                model: "smartphonetest",
                category: "Smartphone",
                quantity: 2,
                details: "",
                sellingPrice: 43,
                arrivalDate: "2022-12-31"
            },
            {
                model: "smartphonetest2",
                category: "Smartphone",
                quantity: 2,
                details: "",
                sellingPrice: 44,
                arrivalDate: "2022-12-31"
            },
            {
                model: "laptopTest",
                category: "Laptop",
                quantity: 2,
                details: "",
                sellingPrice: 45,
                arrivalDate: "2022-12-31"
            }
        ])
    })
})

describe("GET - PRODUCTS_AVAILABILITY", () => {

    test("P_ROUTER_38 - 401 error code - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).get(baseURL)
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_39 - 401 error code - no admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).get(baseURL)
        expect(response.status).toBe(401)
    })
})

describe("DELETE - DELETE_ALL_PRODUCTS", () => {

    test("P_ROUTER_40 - 401 error code - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).delete(baseURL)
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_41 - 401 error code - no admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).delete(baseURL)
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_42 - 200 code - all data inserted", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        const response = await request(app).delete(baseURL)
        expect(response.status).toBe(200)
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1)
    })
})

describe("DELETE - DELETE_PRODUCT_MODEL", () => {

    const testProduct = { //Define a test product object sent to the route
        model: "test",
        category: "Smartphone",
        quantity: 1,
        details: "test",
        sellingPrice: 1000,
        arrivalDate: "2022-12-31"
    }

    beforeEach(async () => {
        jest.clearAllMocks()
        //add a new product
        await request(app).post(baseURL).send(testProduct)
    })

    test("P_ROUTER_43 - 401 error code - not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).delete(baseURL + "/" + testProduct.model)
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_44 - 401 error code - no admin or manager", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthorized" });
        })
        const response = await request(app).delete(baseURL + "/" + testProduct.model)
        expect(response.status).toBe(401)
    })

    test("P_ROUTER_45 - 200 code - all data inserted", async () => {

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true)
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        const response = await request(app).delete(baseURL + "/" + testProduct.model)
        expect(response.status).toBe(200)
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1)
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(testProduct.model)
    })

    test("P_ROUTER_46 - 404 code - Product missing", async () => {
        const errorProduct = { //Define a test product object sent to the route
            model: "not_existing_model",
        }

        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        jest.spyOn(ProductController.prototype, "deleteProduct").mockImplementationOnce(() => {
            throw new ProductNotFoundError();
        })

        const response = await request(app).delete(baseURL + "/" + errorProduct.model)
        expect(response.status).toBe(404)
    })


})