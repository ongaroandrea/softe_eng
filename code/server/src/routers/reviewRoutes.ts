import express, { Router } from "express"
import ErrorHandler from "../helper"
import { body, param, query } from "express-validator"
import ReviewController from "../controllers/reviewController"
import Authenticator from "./auth"
import { ProductReview } from "../components/review"

class ReviewRoutes {
    private controller: ReviewController
    private router: Router
    private errorHandler: ErrorHandler
    private authenticator: Authenticator

    constructor(authenticator: Authenticator) {
        this.authenticator = authenticator
        this.controller = new ReviewController()
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.initRoutes()
    }

    getRouter(): Router {
        return this.router
    }

    initRoutes() {

        /**
         * Route for adding a review to a product.
         * It requires the user calling it to be authenticated and to be a customer
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist.
         * It requires the following body parameters:
         * - score: number. It must be an integer between 1 and 5.
         * - comment: string. It cannot be empty.
         * It returns a 200 status code.
         */
        this.router.post(
            "/:model",
            [this.authenticator.isLoggedIn,
                this.authenticator.isCustomer,
            ],
            param("model").isString().notEmpty(), // Validate the route parameter
            body("score").isInt({ min: 1, max: 5 }), // Validate the score
            body("comment").isString().isLength({ min: 1 }), // Validate the comment
            this.errorHandler.validateRequest, //middleware defined in `helper.ts`, checks the result of all the evaluations performed above and returns a 422 error if at least one fails or continues if there are no issues
            (req: any, res: any, next: any) => this.controller.addReview(req.params.model, req.user, req.body.score, req.body.comment)
                .then(() => res.status(200).send())
                .catch((err: Error) => {
                    next(err)
                })
        )

        /**
         * Route for retrieving all reviews of a product.
         * It requires the user to be authenticathed
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist.
         * It returns an array of reviews
         */
        this.router.get(
            "/:model",
            [this.authenticator.isLoggedIn,
            ],
            param("model").isString().notEmpty(), // Validate the route parameter
            this.errorHandler.validateRequest, // Validate the results of the above checks
            (req: any, res: any, next: any) => 
                this.controller.getProductReviews(req.params.model)
                .then((reviews: any/*ProductReview[]*/) => res.status(200).json(reviews))
                .catch((err: Error) => next(err))
        )

        /**
         * Route for deleting the review made by a user for one product.
         * It requires the user to be authenticated and to be a customer
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist. The user must also have made a review for the product
         * It returns a 200 status code.
         */
        this.router.delete(
            "/:model",
            [this.authenticator.isLoggedIn,
                this.authenticator.isCustomer,
            ],
            param("model").isString().notEmpty(), // Validate the route parameter
            this.errorHandler.validateRequest, // Validate the results of the above checks
            (req: any, res: any, next: any) => this.controller.deleteReview(req.params.model, req.user)
                .then(() => res.status(200).send())
                .catch((err: Error) => {
                    next(err)
                })
        )

        /**
         * Route for deleting all reviews of a product.
         * It requires the user to be authenticated and to be either an admin or a manager
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/:model/all",
            [this.authenticator.isLoggedIn,
                this.authenticator.isAdminOrManager,
            ],
            param("model").isString().notEmpty(), // Validate the route parameter
            this.errorHandler.validateRequest, // Validate the results of the above checks
            (req: any, res: any, next: any) => this.controller.deleteReviewsOfProduct(req.params.model)
                .then(() => res.status(200).send())
                .catch((err: Error) => next(err))
        )

        /**
         * Route for deleting all reviews of all products.
         * It requires the user to be authenticated and to be either an admin or a manager
         * It returns a 200 status code.
         */
        this.router.delete(
            "/",
            [this.authenticator.isLoggedIn,
                this.authenticator.isAdminOrManager,
            ],
            (req: any, res: any, next: any) => this.controller.deleteAllReviews()
                .then(() => res.status(200).send())
                .catch((err: Error) => next(err))
        )
    }
}

export default ReviewRoutes;