import express from "express"
import request from "supertest"
import ReviewRoutes from "../../src/routers/reviewRoutes"
import Authenticator from "../../src/routers/auth"
import ReviewController from "../../src/controllers/reviewController"
import ErrorHandler from "../../src/helper"


// Mock the Authenticator module
jest.mock("../../src/routers/auth")

// Mock the ReviewController module
jest.mock("../../src/controllers/reviewController")

describe("ReviewRoutes", () => {
    let app: express.Application
    let reviewRoutes: ReviewRoutes
    let authenticator: Authenticator
    let controller: ReviewController
    let errorHandler: ErrorHandler

    beforeAll(() => {
        app = express()
        app.use(express.json())

        authenticator = new Authenticator(app)
        reviewRoutes = new ReviewRoutes(authenticator)
        app.use("/reviews", reviewRoutes.getRouter())

        controller = new ReviewController()
        errorHandler = new ErrorHandler()
    })

    beforeEach(() => {
        // Mock Authenticator methods
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            req.isAuthenticated = () => true
            req.user = { id: "sampleUserId", role: "customer", username: "sampleUser" }
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })

        // Mock ReviewController methods
        jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(async () => {})
        jest.spyOn(ReviewController.prototype, "getProductReviews").mockImplementation(async () => [])
        jest.spyOn(ReviewController.prototype, "deleteReview").mockImplementation(async () => {})
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockImplementation(async () => {})
        jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockImplementation(async () => {})

        // Mock ErrorHandler methods
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
            return next()
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    // POST /reviews/:model - add a review
    test("R_Router_01: POST /reviews/:model - add a review", async () => {
        const response = await request(app)
            .post("/reviews/sampleModel")
            .send({ score: 5, comment: "Great product!" })

        expect(response.status).toBe(200)
        expect(ReviewController.prototype.addReview).toHaveBeenCalledWith("sampleModel", { id: "sampleUserId", role: "customer", username: "sampleUser" }, 5, "Great product!")
    })

    test("R_Router_02: POST /reviews/:model - missing parameters", async () => {
        const response = await request(app)
            .post("/reviews/sampleModel")
            .send({ comment: "Great product!" }) // Missing score parameter

        expect(response.status).toBe(422)
    })

    test("R_Router_03: POST /reviews/:model - invalid score parameter", async () => {
        const response = await request(app)
            .post("/reviews/sampleModel")
            .send({ score: 6, comment: "Great product!" }) // Score should be a number

        expect(response.status).toBe(422)
    })

    test("R_Router_04: POST /reviews/:model - unauthorized user", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 })
        })

        const response = await request(app)
            .post("/reviews/sampleModel")
            .send({ score: 5, comment: "Great product!" })

        expect(response.status).toBe(401)
    })



    // GET /reviews/:model - get product reviews
    test("R_Router_05: GET /reviews/:model - get product reviews", async () => {
        const mockReviews = [{ model: "sampleModel", user: "sampleUser", score: 5, date: "2024-05-02", comment: "Great product!" }]
        jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValue(mockReviews)

        const response = await request(app).get("/reviews/sampleModel")

        expect(response.status).toBe(200)
        expect(response.body).toEqual(mockReviews)
        expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith("sampleModel")
    })

    test("R_Router_06: GET /reviews/:model - unauthorized user", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 })
        })

        const response = await request(app).get("/reviews/sampleModel")

        expect(response.status).toBe(401)
    })

    
    // DELETE /reviews/:model - delete a review
    test("R_Router_07: DELETE /reviews/:model - delete a review", async () => {
        //const mockReviews = [{ model: "sampleModel", user: "sampleUser", score: 5, date: "2024-05-02", comment: "Great product!" }]
        const response = await request(app).delete("/reviews/sampleModel")

        expect(response.status).toBe(200)
        expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith("sampleModel", { id: "sampleUserId", role: "customer", username: "sampleUser" })
    })

    test("R_Router_08: DELETE /reviews/:model - unauthorized user", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 })
        })

        const response = await request(app).delete("/reviews/sampleModel")

        expect(response.status).toBe(401)
    })


    // DELETE /reviews/:model/all - delete all reviews of a specific product
    test("R_Router_09: DELETE /reviews/:model/all - delete all reviews of a product", async () => {
        const response = await request(app).delete("/reviews/sampleModel/all")

        expect(response.status).toBe(200)
        expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith("sampleModel")
    })

    
    test("R_Router_10: DELETE /reviews/:model/all - unauthorized user", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized user", status: 401 })
        })

        const response = await request(app).delete("/reviews/sampleModel/all")

        expect(response.status).toBe(401)
    })


    // DELETE /reviews - delete all reviews of all products
    test("R_Router_11: DELETE /reviews - delete all reviews", async () => {
        const response = await request(app).delete("/reviews")

        expect(response.status).toBe(200)
        expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalled()
    })

    test("R_Router_12: DELETE /reviews - unauthorized user", async () => {
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "Unauthorized user", status: 401 })
        })

        const response = await request(app).delete("/reviews")

        expect(response.status).toBe(401)
    })
    
})
