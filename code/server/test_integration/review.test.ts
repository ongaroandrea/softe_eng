import { describe, test, expect, beforeAll, beforeEach, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Category, Product } from "../src/components/product"
import { Cart } from "../src/components/cart"
import { Role } from "../src/components/user"
//import ReviewController from "../src/controllers/reviewController"

const routePath = "/ezelectronics" // Base route path for the API

//let reviewController = new ReviewController();

// Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }

// Product
let product = {
    model: "model1",
    category: Category.SMARTPHONE,
    quantity: 10,
    arrivalDate: "2021-01-01",
    sellingPrice: 1000,
    details: "details"
}

let product_1 = {
    model: "model3",
    category: Category.SMARTPHONE,
    quantity: 10,
    arrivalDate: "2021-01-01",
    sellingPrice: 1000,
    details: "details"
}

let product_2 = {
    model: "model4",
    category: Category.SMARTPHONE,
    quantity: 10,
    arrivalDate: "2021-01-01",
    sellingPrice: 1000,
    details: "details"
}

// Users cookie
let customerCookie: string
let adminCookie: string

// Helper function that creates a new user in the database.
// Can be used to create a user before the tests or in the tests
// Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const postProduct = async (product: any, cookie: string) => {
    const response = await request(app)
        .post(`${routePath}/products`)
        .send(product)
        .set("Cookie", cookie)
    expect(response.status).toBe(200)
}

const deleteAllProducts = async (cookie: string) => {
    await request(app)
        .delete(`${routePath}/products`)
        .set("Cookie", cookie)
        .expect(200)
}

const addProductToCart = async (productModel: string, cookie: string) => {
    const response = await request(app)
        .post(`${routePath}/carts`)
        .set("Cookie", cookie)
        .send({ model: productModel, quantity: 1 })
    expect(response.status).toBe(200)
}

const checkOutCart = async (cookie: string) => {
    const response = await request(app)
        .patch(`${routePath}/carts`)
        .set("Cookie", cookie)
    expect(response.status).toBe(200)
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

beforeAll(async () => {
    await cleanup()
    await postUser(admin)
    adminCookie = await login(admin)

    await postUser(customer)
    customerCookie = await login(customer)
    // Before all, buy a product in order to have the possibility of making a review and then see it, and delete it
    await deleteAllProducts(adminCookie)
    await postProduct(product, adminCookie)
    await postProduct(product_1, adminCookie)
    await postProduct(product_2, adminCookie)
    await addProductToCart(product.model, customerCookie)
    await addProductToCart(product_1.model, customerCookie)
    await addProductToCart(product_2.model, customerCookie)
    await checkOutCart(customerCookie)
})

afterAll(async () => {
    await cleanup()
})

let review1 = {
    model: "model1",
    score: 2,
    comment: "comment"
}

let review2 = {
    model: "model1",
    score: 4,
    comment: "comment"
}

let review3 = {
    model: "model2",
    score: 1,
    comment: "comment"
}

let review4 = {
    model: "model3",
    score: 4,
    comment: "comment"
}

let reviewMissingM = {
    score: 2,
    comment: "comment"
}

let reviewMissingC = {
    model: "model1",
    score: 2
}

let reviewScoreInvalid = {
    model: "model1",
    score: 0,
    comment: "comment"
}

describe("Review routes integration tests", () => {
    describe("POST /reviews/:model", () => {
        test("R_INT_01: It should return a 200 success code and add a review to a product", async () => {
            await request(app)
                .post(`${routePath}/reviews/${review1.model}`)
                .send({ score: review1.score, comment: review1.comment })
                .set("Cookie", customerCookie)
                .expect(200)
               // expect(reviewController.addReview(review1.model, user, review1.score, review1.comment)).toHaveBeenCalled()
        })
       

        test("R_INT_02: It should return a 404 error if the model is missing", async () => {
            await request(app)
                .post(`${routePath}/reviews/`)
                .send({ score: review1.score, comment: review1.comment })
                .set("Cookie", customerCookie)
                .expect(404)
        })

        test("R_INT_03: It should return a 422 error if the comment is missing", async () => {
            await request(app)
                .post(`${routePath}/reviews/${reviewMissingC.model}`)
                .send({ score: reviewMissingC.score })
                .set("Cookie", customerCookie)
                .expect(422)
        })

        test("R_INT_04: It should return a 422 error if the score is invalid", async () => {
            await request(app)
                .post(`${routePath}/reviews/${reviewScoreInvalid.model}`)
                .send({ score: reviewScoreInvalid.score, comment: reviewScoreInvalid.comment })
                .set("Cookie", customerCookie)
                .expect(422)
        })

        test("R_INT_05: It should return a 401 error if the user is not logged in", async () => {
            await request(app)
                .post(`${routePath}/reviews/${review1.model}`)
                .send({ score: review1.score, comment: review1.comment })
                .expect(401)
            })
        
            test("R_INT_06: It should return a 401 error if the user is not a customer", async () => {
                await request(app)
                    .post(`${routePath}/reviews/${review1.model}`)
                    .send({ score: review1.score, comment: review1.comment })
                    .set("Cookie", adminCookie)
                    .expect(401)
            })
    
            test("R_INT_07: It should return a 404 error if the product was not bought by the user", async () => {
                await request(app)
                    .post(`${routePath}/reviews/${review3.model}`)
                    .send({ score: review3.score, comment: review3.comment })
                    .set("Cookie", customerCookie)
                    .expect(404)
            })
    
            test("R_INT_08: It should return a 409 error if the product is already reviewed by the user", async () => {
                await request(app)
                    .post(`${routePath}/reviews/${review1.model}`)
                    .send({ score: review2.score, comment: review2.comment })
                    .set("Cookie", customerCookie)
                    .expect(409)
            }) 
        })

        describe("DELETE /reviews/:model", () => {
            test("R_INT_09: It should return a 200 success code and delete the review made by the logged-in user", async () => {
                const review_4 = await request(app)
                    .post(`${routePath}/reviews/${review4.model}`)
                    .send({ score: review4.score, comment: review4.comment })
                    .set("Cookie", customerCookie)
                expect(review_4.status).toBe(200) 
    
                const deleteResponse = await request(app)
                    .delete(`${routePath}/reviews/${review4.model}`)
                    .set("Cookie", customerCookie)
                expect(deleteResponse.status).toBe(200)
            })

            test("R_INT_10: It should return 404 if the product doesn't exists", async () => {
                await request(app)
                    .delete(`${routePath}/reviews/${"model_nonexisting"}`)
                    .set("Cookie", customerCookie)
                    .expect(404)
            })

            test("R_INT_11:  It should return 404 if the user hasn't reviewed the product", async () => {
                await request(app)
                    .delete(`${routePath}/reviews/${product_2.model}`)
                    .set("Cookie", customerCookie)
                    .expect(404)
            })

            /*test("R_INT_11:  It should return 401 if the user is not a customer", async () => {
                await request(app)
                    .delete(`${routePath}/reviews/${review1.model}`)
                    .set("Cookie", adminCookie)
                    .expect(401)
            }) */
    }) 
    
       
        describe("GET /reviews/:model", () => {
            test("R_INT_12: It should return a 200 success code and the reviews assigned to a product for a customer are shown", async () => {
                await request(app)
                    .get(`${routePath}/reviews/${review1.model}`)
                    .set("Cookie", customerCookie)
                    .expect(200)
                    .expect(response => {
                        expect(response.body).toBeInstanceOf(Array)
                    })
            })
    
            test("R_INT_13: It should return a 200 success code and the reviews assigned to a product for an admin", async () => {
                await request(app)
                    .get(`${routePath}/reviews/${review1.model}`)
                    .set("Cookie", adminCookie)
                    .expect(200)
                    .expect(response => {
                        expect(response.body).toBeInstanceOf(Array)
                    })
            })
        })
    
        describe("DELETE /reviews/:model/all", () => {
            test("R_INT_14: It should return a 200 success code and all the reviews assigned to a product are deleted by an admin", async () => {
                await request(app)
                    .delete(`${routePath}/reviews/${review1.model}/all`)
                    .set("Cookie", adminCookie)
                    .expect(200)
            })
    
            test("R_INT_15: It should return a 401 error if a non-admin tries to delete all reviews of a product", async () => {
                await request(app)
                    .delete(`${routePath}/reviews/${review1.model}/all`)
                    .set("Cookie", customerCookie)
                    .expect(401)
            })
        })

        describe("DELETE /reviews", () => {
            test("R_INT_16: It should return a 200 success code and all the reviews are deleted by an admin", async () => {
                await request(app)
                    .delete(`${routePath}/reviews`)
                    .set("Cookie", adminCookie)
                    .expect(200)
            })
    
            test("R_INT_17: It should return a 401 error if a non-admin tries to delete all reviews of a product", async () => {
                await request(app)
                    .delete(`${routePath}/reviews/`)
                    .set("Cookie", customerCookie)
                    .expect(401)
                    
            })
        })
    })
    