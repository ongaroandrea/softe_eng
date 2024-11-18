import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Category } from "../src/components/product"

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup()
    await postUser(admin)
    adminCookie = await login(admin)
    await postUser(customer)
    customerCookie = await login(customer)
})

//After executing tests, we remove everything from our test database
afterAll(async () => {
    await cleanup()
})



let product = {
    model: "model1",
    category: Category.SMARTPHONE,
    quantity: 10,
    arrivalDate: "2021-01-01",
    sellingPrice: 1000,
    details: "details"
}

let product2 = {
    model: "model2",
    category: Category.LAPTOP,
    quantity: 20,
    sellingPrice: 2000,
    details: "details"
}
let product3 = {
    model: "model3",
    category: Category.SMARTPHONE,
    quantity: 0,
    arrivalDate: "2021-01-03",
    sellingPrice: 3000,
    details: "details"
}

//missing quantity
let productMissing = {
    model: "model4",
    category: Category.SMARTPHONE,
    arrivalDate: "2021-01-04",
    sellingPrice: 4000,
    details: "details"
}

//missing model
let productMissing2 = {
    category: Category.SMARTPHONE,
    quantity: 50,
    arrivalDate: "2021-01-05",
    sellingPrice: 5000,
    details: "details"
}

//zero quantity products
let productZero = {
    model: "model5",
    category: Category.SMARTPHONE,
    quantity: 0,
    arrivalDate: "2021-01-06",
    sellingPrice: 6000,
    details: "details"
}

let productZero2 = {
    model: "model6",
    category: Category.SMARTPHONE,
    quantity: 0,
    arrivalDate: "2021-01-07",
    sellingPrice: 7000,
    details: "details"
}


describe("Product routes integration tests", () => {

    describe("POST /products", () => {
        test("#P_INT01 - It should return a 200 success code and create a new product", async () => {

            //We create a new product and check if it is returned correctly
            await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie", adminCookie)
                .expect(200)

            //We get all products and check if the new product is in the list
            const products = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200)

            //We check if the product is in the list and if the values are correct
            expect(products.body).toHaveLength(1)
            let prod = products.body[0]
            expect(prod.model).toBe(product.model)
            expect(prod.category).toBe(product.category)
            expect(prod.quantity).toBe(product.quantity)
            expect(prod.arrivalDate).toBe(product.arrivalDate)
            expect(prod.sellingPrice).toBe(product.sellingPrice)
        })

        test("#P_INT02 - It should return a 200 success code and create a new product without arrivalDate defined", async () => {
            await request(app)
                .post(`${routePath}/products`)
                .send(product2)
                .set("Cookie", adminCookie)
                .expect(200)

            const products = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200)
            expect(products.body).toHaveLength(2)
            let prod = products.body[1]
            let currentDate = new Date().toISOString().split("T")[0]
            expect(prod.model).toBe(product2.model)
            expect(prod.category).toBe(product2.category)
            expect(prod.quantity).toBe(product2.quantity)

            expect(prod.arrivalDate).toBe(currentDate)
            expect(prod.sellingPrice).toBe(product2.sellingPrice)
        })

        test("#P_INT03 - It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await request(app)
                .post(`${routePath}/products`)
                .send(productMissing)
                .set("Cookie", adminCookie)
                .expect(422)

            await request(app)
                .post(`${routePath}/products`)
                .send(productMissing2)
                .set("Cookie", adminCookie)
                .expect(422)
        })

        test("#P_INT04 - It should return a 409 error code if the product already exists", async () => {

            //We try to create a product that already exists and check if the return code is 409
            await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie", adminCookie)
                .expect(409)
        })

        test("#P_INT05 - It should return a 401 error code if the user is not an Admin", async () => {
            customerCookie = await login(customer)
            await request(app).post(`${routePath}/products`).send(product2).set("Cookie", customerCookie).expect(401)
            await request(app).post(`${routePath}/products`).send(product3).expect(401)
        })

        test("#P_INT06 - It should return a 422 error code if the quantity is 0", async () => {
            await request(app).post(`${routePath}/products`).send(productZero).set("Cookie", adminCookie).expect(422)
            await request(app).post(`${routePath}/products`).send(productZero2).set("Cookie", adminCookie).expect(422)
        })
    })

    describe("GET /products", () => {

        //We get all products and check if the values are correct
        //We should have two products in the list at this point - product and product2
        test("#P_INT07 - It should return an array of products", async () => {
            const products = await request(app).get(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            expect(products.body).toHaveLength(2)
            let prod = products.body[0]
            expect(prod.model).toBe(product.model)
            expect(prod.category).toBe(product.category)
            expect(prod.quantity).toBe(product.quantity)
            expect(prod.arrivalDate).toBe(product.arrivalDate)
            expect(prod.sellingPrice).toBe(product.sellingPrice)
        })

        test("#P_INT08 - It should return an array of product based on the category Laptop", async () => {
            const products = await request(app).get(`${routePath}/products?grouping=category&category=Laptop`).set("Cookie", adminCookie).expect(200)
            expect(products.body).toHaveLength(1)
            let prod = products.body[0]
            expect(prod.model).toBe(product2.model)
            expect(prod.category).toBe(Category.LAPTOP)
            expect(prod.quantity).toBe(product2.quantity)
            expect(prod.arrivalDate).toBe(new Date().toISOString().split("T")[0])
            expect(prod.sellingPrice).toBe(product2.sellingPrice)
        })

        test("#P_INT09 - It should return an array of product based on the category Smartphone", async () => {
            const products = await request(app).get(`${routePath}/products?grouping=category&category=Smartphone`).set("Cookie", adminCookie).expect(200)
            expect(products.body).toHaveLength(1)
            let prod = products.body[0]
            expect(prod.model).toBe(product.model)
            expect(prod.category).toBe(Category.SMARTPHONE)
            expect(prod.quantity).toBe(product.quantity)
            expect(prod.arrivalDate).toBe(product.arrivalDate)
            expect(prod.sellingPrice).toBe(product.sellingPrice)
        })

        test("#P_INT10 - It should return a product based on the model", async () => {
            const products = await request(app).get(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            let prod = products.body[0]
            const product_response = await request(app).get(`${routePath}/products?grouping=model&model=${prod.model}`).set("Cookie", adminCookie).expect(200)
            let prod2 = product_response.body[0]
            expect(prod2.model).toBe(product.model)
            expect(prod2.category).toBe(product.category)
            expect(prod2.quantity).toBe(product.quantity)
            expect(prod2.arrivalDate).toBe(product.arrivalDate)
            expect(prod2.sellingPrice).toBe(product.sellingPrice)
        })

        test("#P_INT11 - It should return a 401 error code if the user is not an Admin", async () => {
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/products`).set("Cookie", customerCookie).expect(401)
            request(app).get(`${routePath}/products`).expect(401)
        })
    })

    describe("PATCH /products/:model/sell/", () => {
        test("#P_INT12 - It should return a 200 success code and decrease the quantity of a product", async () => {
            let url = `${routePath}/products/${product2.model}/sell`
            await request(app).patch(url).send({ quantity: 20 }).set("Cookie", adminCookie).expect(200)
            let url2 = `${routePath}/products?grouping=model&model=${product2.model}`
            const product = await request(app).get(url2).set("Cookie", adminCookie).expect(200)
            expect(product.body[0].quantity).toBe(0)
        })

        test("#P_INT13 - It should return a 409 error code if the quantity is greater than the available quantity", async () => {
            await request(app).patch(`${routePath}/products/${product.model}/sell`).send({ quantity: 100 }).set("Cookie", adminCookie).expect(409)
        })

        test("#P_INT14 - It should return a 422 error code if the quantity is 0 or negative", async () => {
            await request(app).patch(`${routePath}/products/${product.model}/sell`).send({ quantity: 0 }).set("Cookie", adminCookie).expect(422)
            await request(app).patch(`${routePath}/products/${product.model}/sell`).send({ quantity: -1 }).set("Cookie", adminCookie).expect(422)
        })

        test("#P_INT15 - It should return a 404 error code if the product does not exist", async () => {
            await request(app).patch(`${routePath}/products/0/sell`).send({ quantity: 5 }).set("Cookie", adminCookie).expect(404)
        })

        test("#P_INT16 - It should return a 401 error code if the user is not an Admin", async () => {
            customerCookie = await login(customer)
            await request(app).patch(`${routePath}/products/${product.model}/sell`).send({ quantity: 5 }).set("Cookie", customerCookie).expect(401)
            await request(app).patch(`${routePath}/products/${product.model}/sell`).send({ quantity: 5 }).expect(401)
        })
    })

    describe("GET /products/available", () => {

        //based on the previuos tests, we have 2 products in the database, but only one of them has a quantity greater than 0
        test("#P_INT17 - It should return an array of available products", async () => {
            const products = await request(app).get(`${routePath}/products/available`).set("Cookie", adminCookie).expect(200)
            expect(products.body).toHaveLength(1)
            let prod = products.body[0]
            expect(prod.model).toBe(product.model)
            expect(prod.category).toBe(product.category)
            expect(prod.quantity).toBe(product.quantity)
            expect(prod.arrivalDate).toBe(product.arrivalDate)
            expect(prod.sellingPrice).toBe(product.sellingPrice)
        })

        test("#P_INT18 - It should return an array of available products based on the category Laptop", async () => {
            const products = await request(app).get(`${routePath}/products/available?grouping=category&category=Laptop`).set("Cookie", adminCookie).expect(200)
            expect(products.body).toHaveLength(0)
        })

        test("#P_INT19 - It should return an array of available products based on the category Smartphone", async () => {
            const products = await request(app).get(`${routePath}/products/available?grouping=category&category=Smartphone`).set("Cookie", adminCookie).expect(200)
            expect(products.body).toHaveLength(1)
            let prod = products.body[0]
            expect(prod.category).toBe(Category.SMARTPHONE)
        })

        test("#P_INT20 - It should return a 401 error code if the user is not logged", async () => {
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/products/available`).expect(401)
        })
    })

    describe("PATCH /products/:model", () => {
        test("#P_INT21 - It should return a 200 success code and update a product", async () => {
            const products = await request(app).get(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            let prod = products.body[0]
            await request(app)
                .patch(`${routePath}/products/${prod.model}`)
                .send({ quantity: 20 })
                .set("Cookie", adminCookie)
                .expect(200)

            const product_response = await request(app).get(`${routePath}/products?grouping=model&model=${prod.model}`).set("Cookie", adminCookie).expect(200)
            expect(product_response.body[0].quantity).toBe(30)
        })

        test("#P_INT22 - It should return a 422 error code if quantity is missing", async () => {
            const products = await request(app).get(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            let prod = products.body[0]
            await request(app)
                .patch(`${routePath}/products/${prod.model}`)
                .send()
                .set("Cookie", adminCookie)
                .expect(422)
            await request(app).patch(`${routePath}/products/${prod.model}`).send(productMissing).set("Cookie", adminCookie).expect(422)
        })

        test("#P_INT23 - It should return a 401 error code if the user is not an Admin", async () => {
            const products = await request(app).get(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            let prod = products.body[0]
            customerCookie = await login(customer)
            await request(app).patch(`${routePath}/products/${prod.model}`).send({ quantity: 10 }).set("Cookie", customerCookie).expect(401)
            await request(app).patch(`${routePath}/products/${prod.model}`).send({ name: "newProduct", price: 20, stock: 20 }).expect(401)
        })
    })

    describe("DELETE /products/:id", () => {

        //It removes the first product so it should return the second product
        test("#P_INT24 - It should return a 200 success code and delete a product", async () => {
            const products = await request(app).get(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            let prod = products.body[0]
            await request(app).delete(`${routePath}/products/${prod.model}`).set("Cookie", adminCookie).expect(200)

            const products2 = await request(app).get(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            expect(products2.body).toHaveLength(1)
        })

        //The product is already deleted, so it should return a 404 error code
        test("#P_INT25 - It should return a 404 error code if the product does not exist", async () => {
            await request(app).delete(`${routePath}/products/${product.model}`).set("Cookie", adminCookie).expect(404)
        })

        //The user is not an Admin, so it should return a 401 error code
        test("#P_INT26 - It should return a 401 error code if the user is not an Admin", async () => {
            const products = await request(app).get(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            let prod = products.body[0]
            customerCookie = await login(customer)
            await request(app).delete(`${routePath}/products/${prod.model}`).set("Cookie", customerCookie).expect(401)
            await request(app).delete(`${routePath}/products/${prod.model}`).expect(401)
        })
    })

    describe("DELETE /products", () => {
        test("#P_INT27 - It should return a 200 success code and delete all products", async () => {
            await request(app).delete(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            const products = await request(app).get(`${routePath}/products`).set("Cookie", adminCookie).expect(200)
            expect(products.body).toHaveLength(0)
        })

        test("#P_INT28 - It should return a 401 error code if the user is not an Admin", async () => {
            await request(app).delete(`${routePath}/products`).set("Cookie", customerCookie).expect(401)
            await request(app).delete(`${routePath}/products`).expect(401)
        })
    })
})