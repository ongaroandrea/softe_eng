import { describe, test, expect, beforeAll, beforeEach, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Category, Product } from "../src/components/product"

const routePath = "/ezelectronics" // Base route path for the API

// Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const customerwithnocart = { username : "customerwithnocart", name: "C", surname: "C", password: "C", role: "Customer"}
const customer2 = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }

// Product
const product1 = { sellingPrice: 50, model: "model1", category: Category.SMARTPHONE, details: "details", quantity: 50, arrivalDate: "2021-01-01" }
const product2 = { sellingPrice: 600, model: "model2", category: Category.LAPTOP, details: "details", quantity: 100, arrivalDate: "2021-01-02" }
const noquantityproduct = { sellingPrice: 1000, model: "model3", category: Category.APPLIANCE, details: "details", quantity: 1, arrivalDate: "2021-01-03" }
const productsoldout = { sellingPrice: 50, model: "model4", category: Category.SMARTPHONE, details: "details", quantity: 1, arrivalDate: "2021-01-04" }
const nonexistingproduct = { sellingPrice: 50, model: "nonexistingmodel", category: Category.SMARTPHONE, details: "details", quantity: 50, arrivalDate: "2021-01-01" }

// Cookies for the users. We use them to keep users logged in. Creating them once and saving them in variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string
let customerwithnocartCookie : string
let customer2Cookie : string

// Helper function that creates a new user in the database.
// Can be used to create a user before the tests or in the tests
// Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

// Helper function that logs in a user and returns the cookie
// Can be used to log in a user before the tests or in the tests
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

// Create a product
const postProduct = async (product: any, cookie: string) => {
    const response = await request(app)
        .post(`${routePath}/products`)
        .send(product)
        .set("Cookie", cookie)
    expect(response.status).toBe(200)
}

// Delete all products
const deleteAllProducts = async (cookie: string) => {
    await request(app)
        .delete(`${routePath}/products`)
        .set("Cookie", cookie)
        .expect(200)
}

// Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup() // Ensure the database is clean before starting the tests
    await postUser(admin)
    adminCookie = await login(admin)

    await postUser(customer)
    customerCookie = await login(customer)

    await postUser(customerwithnocart)
    customerwithnocartCookie = await login(customerwithnocart)

    await postUser(customer2)
    customer2Cookie = await login(customer2)

    await deleteAllProducts(adminCookie)
    await postProduct(product1, adminCookie)
    await postProduct(product2, adminCookie)
    await postProduct(noquantityproduct, adminCookie)
    let url1 = `${routePath}/products/${noquantityproduct.model}/sell`
    await request(app).patch(url1).send({ quantity: 1 }).set("Cookie", adminCookie).expect(200)
    await postProduct(productsoldout, adminCookie)
})



// After executing tests, we remove everything from our test database
afterAll(async () => {
    await cleanup()
})

describe("Product routes integration tests", () => {

    describe ("POST /carts", () =>{
        test("C_INT01 - It should return a 200 success code, create a cart and add a product to this cart", async () => {
            await request(app).post(`${routePath}/carts`).send(product1).set("Cookie", customerCookie).expect(200)

            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)
            expect(cart.body.customer).toBe(customer.username)
            expect(cart.body.paid).toBe(false)
            expect(cart.body.paymentDate).toBe(null)
            expect(cart.body.total).toBe(50)
            expect(cart.body.products).toEqual([{ price: 50, model: "model1", category: Category.SMARTPHONE, quantity: 1 }])
        })

        test("C_INT02 - It should return a 200 success code and add a product that is already in the cart", async () => {
            await request(app).post(`${routePath}/carts`).send(product1).set("Cookie", customerCookie).expect(200)

            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)
            expect(cart.body.customer).toBe(customer.username)
            expect(cart.body.paid).toBe(false)
            expect(cart.body.paymentDate).toBe(null)
            expect(cart.body.total).toBe(100)
            expect(cart.body.products).toEqual([{ price: 50, model: "model1", category: Category.SMARTPHONE, quantity: 2 }])
        })

        test("C_INT03 - It should return a 200 success code and add a product that isn't already in the cart", async () => {
            await request(app).post(`${routePath}/carts`).send(product2).set("Cookie", customerCookie).expect(200)

            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)
            expect(cart.body.customer).toBe(customer.username)
            expect(cart.body.paid).toBe(false)
            expect(cart.body.paymentDate).toBe(null)
            expect(cart.body.total).toBe(700)
            expect(cart.body.products).toEqual([{ price: 50, model: "model1", category: Category.SMARTPHONE, quantity: 2 },{ price: 600, model: "model2", category: Category.LAPTOP, quantity: 1 }])
        })

        test("C_INT04 - It should return a 404 error if product doesn't exist", async () => {
            await request(app).post(`${routePath}/carts`).send(nonexistingproduct).set("Cookie", customerCookie).expect(404)
        })

        test("C_INT05 - It should return a 409 error if product stock is low", async () => {
            await request(app).post(`${routePath}/carts`).send(noquantityproduct).set("Cookie", customerCookie).expect(409)
        })

        test("C_INT06 - It should return a 401 error code if the user is not a customer", async () => {
            await request(app).post(`${routePath}/carts`).send(product1).set("Cookie", adminCookie).expect(401)
        })

    })
    
    
    describe ("GET /carts", () =>{
        test("C_INT07 - It should return a 200 success code and get user's current cart", async () => {

            await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)
        })

        test("C_INT08 - It should return a 200 success code and an empty cart", async () => {
            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerwithnocartCookie)
                .expect(200)
            expect(cart.body.customer).toBe(customerwithnocart.username)
            expect(cart.body.paid).toBe(false)
            expect(cart.body.paymentDate).toBe(null)
            expect(cart.body.total).toBe(0)
            expect(cart.body.products).toEqual([])

        })

        test("C_INT09 - It should return a 401 error code if the user is not a customer", async () => {
            await request(app).get(`${routePath}/carts`).set("Cookie", adminCookie).expect(401)
        })
    })

    describe ("DELETE /products/:model", () =>{
        
        test("C_INT10 - It should return a 200 success if a product with quantity higher than 2 has been deleted from cart", async () => {
            await request(app).delete(`${routePath}/carts/products/${product1.model}`).set("Cookie", customerCookie).expect(200)

            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)
            expect(cart.body.customer).toBe(customer.username)
            expect(cart.body.paid).toBe(false)
            expect(cart.body.paymentDate).toBe(null)
            expect(cart.body.total).toBe(650)
            expect(cart.body.products).toEqual([{ price: 50, model: "model1", category: Category.SMARTPHONE, quantity: 1 },{ price: 600, model: "model2", category: Category.LAPTOP, quantity: 1 }])
        })

        test("C_INT11 - It should return a 200 success if a product with one instance in cart has been deleted from cart", async () => {
            await request(app).delete(`${routePath}/carts/products/${product2.model}`).set("Cookie", customerCookie).expect(200)

            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)
            expect(cart.body.customer).toBe(customer.username)
            expect(cart.body.paid).toBe(false)
            expect(cart.body.paymentDate).toBe(null)
            expect(cart.body.total).toBe(50)
            expect(cart.body.products).toEqual([{ price: 50, model: "model1", category: Category.SMARTPHONE, quantity: 1 }])
        })

        test("C_INT12 - It should return a 404 error if product doesn't exist", async () => {
            await request(app).delete(`${routePath}/carts/products/nonexistingproduct`).set("Cookie", customerCookie).expect(404)
        })

        test("C_INT13 - It should return a 404 error if product not in cart", async () => {
            await request(app).delete(`${routePath}/carts/products/${product2.model}`).set("Cookie", customerCookie).expect(404)
        })

        test("C_INT14 - It should return a 404 error if user have no current cart", async () => {
            await request(app).delete(`${routePath}/carts/products/${product2.model}`).set("Cookie", customerwithnocartCookie).expect(404)
        })
               
        test("C_INT15 - It should return a 401 error code if the user is not a customer", async () => {
            await request(app).delete(`${routePath}/carts/products/${product1.model}`).set("Cookie", adminCookie).expect(401)
        })
        
    })

    describe ("PATCH /carts", () =>{
        test("C_INT16 - It should return a 200 success code and checkout user's current cart", async () => {

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)
            
            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)
            expect(cart.body.customer).toBe(customer.username)
            expect(cart.body.paid).toBe(false)
            expect(cart.body.paymentDate).toBe(null)
            expect(cart.body.total).toBe(0)
            expect(cart.body.products).toEqual([])

            const products = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200)
            let prod = products.body[0]
            expect(prod.quantity).toBe(49)
        })

        test("C_INT17 - It should return a 404 error if user have no current cart", async () => {
            await request(app).patch(`${routePath}/carts`).set("Cookie", customerwithnocartCookie).expect(404)
        })

        test("C_INT18 - It should return a 409 error if there is not enough product stock", async () => {
            // We have an error here, code does't add 
            await request(app).post(`${routePath}/carts`).send(productsoldout).set("Cookie", customer2Cookie).expect(200)

            let url = `${routePath}/products/${productsoldout.model}/sell`
            await request(app).patch(url).send({ quantity: 1 }).set("Cookie", adminCookie).expect(200)

            await request(app).patch(`${routePath}/carts`).set("Cookie", customer2Cookie).expect(409)

        })

        test("C_INT19 - It should return a 401 error code if the user is not a customer", async () => {
            await request(app).patch(`${routePath}/carts`).set("Cookie", adminCookie).expect(401)
        })

    })

    describe ("DELETE /carts/current", () =>{
        test("C_INT20 - It should return a 200 success code if the user's current cart has been cleared", async () => {
            
            await request(app).delete(`${routePath}/carts/current`).set("Cookie", customer2Cookie).expect(200)
            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customer2Cookie)
                .expect(200)
            expect(cart.body.customer).toBe(customer2.username)
            expect(cart.body.paid).toBe(false)
            expect(cart.body.paymentDate).toBe(null)
            expect(cart.body.total).toBe(0)
            expect(cart.body.products).toEqual([])
        })

        test("C_INT21 - It should return a 404 error if user have no current cart", async () => {
            await request(app).delete(`${routePath}/carts/current`).set("Cookie", customerwithnocartCookie).expect(404)
        })

        test("C_INT22 - It should return a 401 error code if the user is not a customer", async () => {
            await request(app).delete(`${routePath}/carts/current`).set("Cookie", adminCookie).expect(401)
        })

        test("C_INT23 - It should return a 400 error if user's cart is empty during checkout", async () => {
            await request(app).patch(`${routePath}/carts`).set("Cookie", customer2Cookie).expect(400)
        })
    })

    describe ("GET /carts/history", () =>{
        test("C_INT24 - It should return a 200 success code and get user's paid carts", async () => {

            const cart = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", customerCookie)
                .expect(200)
            expect(cart.body[0].customer).toBe(customer.username)
            expect(cart.body[0].paid).toBe(true)
            expect(cart.body[0].total).toBe(50)
            expect(cart.body[0].products).toEqual([{ price: 50, model: "model1", category: Category.SMARTPHONE, quantity: 1 }])
        })

        test("C_INT25 - It should return a 401 error code if the user is not a customer", async () => {
            await request(app).get(`${routePath}/carts`).set("Cookie", adminCookie).expect(401)
        })

    })

    describe ("GET /carts/all", () =>{
        test("C_INT26 - It should return a 200 success code and get all carts", async () => {

            const cart = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", adminCookie)
                .expect(200)
            expect(cart.body[0].customer).toBe(customer.username)
            expect(cart.body[0].paid).toBe(true)
            expect(cart.body[0].total).toBe(50)
            expect(cart.body[0].products).toEqual([{ price: 50, model: "model1", category: Category.SMARTPHONE, quantity: 1 }])
        })

        test("C_INT27 - It should return a 401 error code if the user is not an admin or a manager", async () => {
            await request(app).get(`${routePath}/carts/all`).set("Cookie", customerCookie).expect(401)
        })

    })

    describe ("DELETE /carts", () =>{
        test("C_INT28 - It should return a 200 success code if all carts have been deleted", async () => {
            await request(app).delete(`${routePath}/carts`).set("Cookie", adminCookie).expect(200)
        })

        test("C_INT29 - It should return a 401 error code if the user is not an admin or a manager", async () => {
            await request(app).delete(`${routePath}/carts`).set("Cookie", customerCookie).expect(401)
        })
    })



})