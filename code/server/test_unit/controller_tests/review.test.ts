import { describe, test, expect, jest, beforeAll, afterAll, afterEach } from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController";
import ReviewDAO from "../../src/dao/reviewDAO";
import ProductDAO from "../../src/dao/productDAO";
import { User, Role } from "../../src/components/user";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";
import { ModelNotFoundError } from "../../src/errors/productError";
import { ProductNotInCartError } from "../../src/errors/cartError";
import { Product, Category } from "../../src/components/product";
import { ProductReview } from "../../src/components/review";


jest.mock("../../src/dao/reviewDAO");

describe("ReviewController", () => {
    //let ReviewDAO.prototype: ReviewDAO.prototype;
    let reviewController: ReviewController;



    beforeAll(() => {
       // ReviewDAO.prototype = new ReviewDAO.prototype();
        reviewController = new ReviewController();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("addReview", () => {
        test("R_CONTROLLER_01: It should throw ModelNotFoundError if the product does not exist", async () => {
            const user: User = {
                username: "john_doe",
                name: "John",
                surname: "Doe",
                role: Role.CUSTOMER,
                address: "123 Main St",
                birthdate: "1990-01-01"
            };
            const model = "nonexistent_model";
            const score = 5;
            const comment = "Great product!";

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

            await expect(reviewController.addReview(model, user, score, comment))
                .rejects
                .toThrow(ModelNotFoundError);
        });

        
        /*test("R_CONTROLLER_02: It should throw ProductNotInCartError if the product is not bought", async () => {
            const user: User = {
                username: "john_doe",
                name: "John",
                surname: "Doe",
                role: Role.CUSTOMER,
                address: "123 Main St",
                birthdate: "1990-01-01"
            };
            const model = "model_not_bought";
            const score = 5;
            const comment = "Great product!";
            const product: Product = {
                sellingPrice: 50,
                model: "model_not_bought",
                arrivalDate: "",
                category: Category.SMARTPHONE,
                details: "",
                quantity: 50
            };
    
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product);
            jest.spyOn(ReviewDAO.prototype, "isProductBought").mockResolvedValue(false);
    
            await expect(reviewController.addReview(model, user, score, comment))
                .rejects
                .toThrow(ProductNotInCartError);
        }); */

        test("R_CONTROLLER_03: it should throw ExistingReviewError if the review already exists", async () => {
            const user: User = {
                username: "john_doe",
                name: "John",
                surname: "Doe",
                role: Role.CUSTOMER,
                address: "123 Main St",
                birthdate: "1990-01-01"
            };
            const model = "existing_model";
            const score = 5;
            const comment = "Great product!";
            const product: Product = {
                sellingPrice: 50,
                model: "model1",
                arrivalDate: "",
                category: Category.SMARTPHONE,
                details: "",
                quantity: 50
            };

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product);
            jest.spyOn(ReviewDAO.prototype, "isProductBought").mockResolvedValue(true);
            jest.spyOn(ReviewDAO.prototype, "checkReviewExists").mockResolvedValue(true);

            await expect(reviewController.addReview(model, user, score, comment))
                .rejects
                .toThrow(ExistingReviewError);
        });


        test("R_CONTROLLER_04: it should call addReview in DAO if the product exists and review does not exist", async () => {
            const user: User = {
                username: "john_doe",
                name: "John",
                surname: "Doe",
                role: Role.CUSTOMER,
                address: "123 Main St",
                birthdate: "1990-01-01"
            };
            const model = "model1";
            const score = 5;
            const comment = "Great product!";
            const product: Product = {
                sellingPrice: 50,
                model: "model1",
                arrivalDate: "",
                category: Category.SMARTPHONE,
                details: "",
                quantity: 50
            };

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product);
            jest.spyOn(ReviewDAO.prototype, "isProductBought").mockResolvedValue(true);
            jest.spyOn(ReviewDAO.prototype, "checkReviewExists").mockResolvedValue(false);
            jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValue();

            await reviewController.addReview(model, user, score, comment);

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(model);
            expect(ReviewDAO.prototype.checkReviewExists).toHaveBeenCalledWith(model, user.username);
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(model, user, score, comment);
        });
    });

    describe("deleteReview", () => {
        test("R_CONTROLLER_05: it should throw ModelNotFoundError if the product does not exist", async () => {
            const user: User = {
                username: "john_doe",
                name: "John",
                surname: "Doe",
                role: Role.CUSTOMER,
                address: "123 Main St",
                birthdate: "1990-01-01"
            };
            const model = "nonexistent_model";

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

            await expect(reviewController.deleteReview(model, user))
                .rejects
                .toThrow(ModelNotFoundError);
        });

        test("R_CONTROLLER_06: it should throw NoProductReviewError if the review for the product does not exist", async () => {
            const user: User = {
                username: "john_doe",
                name: "John",
                surname: "Doe",
                role: Role.CUSTOMER,
                address: "123 Main St",
                birthdate: "1990-01-01"
            };
            const model = "model1";
            const product: Product = {
                sellingPrice: 50,
                model: "model1",
                arrivalDate: "",
                category: Category.SMARTPHONE,
                details: "",
                quantity: 50
            };

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product);
            jest.spyOn(ReviewDAO.prototype, "checkReviewExists").mockResolvedValue(false);

            await expect(reviewController.deleteReview(model, user))
                .rejects
                .toThrow(NoReviewProductError);
        });

        test("R_CONTROLLER_07: it should call deleteReview in DAO if the product exists and review exists", async () => {
            const user: User = {
                username: "john_doe",
                name: "John",
                surname: "Doe",
                role: Role.CUSTOMER,
                address: "123 Main St",
                birthdate: "1990-01-01"
            };
            const model = "model1";
            const product: Product = {
                sellingPrice: 50,
                model: "model1",
                arrivalDate: null,
                category: Category.SMARTPHONE,
                details: "",
                quantity: 50
            };

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product);
            jest.spyOn(ReviewDAO.prototype, "checkReviewExists").mockResolvedValue(true);
            jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValue();

            await reviewController.deleteReview(model, user);

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(model);
            expect(ReviewDAO.prototype.checkReviewExists).toHaveBeenCalledWith(model, user.username);
            expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(model, user);
        });
    });

    describe("deleteReviewsOfProduct", () => {
        test("R_CONTROLLER_08: it should throw ModelNotFoundError if the product does not exist", async () => {
            const model = "nonexistent_model";

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

            await expect(reviewController.deleteReviewsOfProduct(model))
                .rejects
                .toThrow(ModelNotFoundError);
        });

        test("R_CONTROLLER_09: it should call deleteReviewsOfProduct in DAO if the product exists", async () => {
            const model = "model1";
            const product: Product = {
                sellingPrice: 50,
                model: "model1",
                arrivalDate: null,
                category: Category.SMARTPHONE,
                details: "",
                quantity: 50
            };

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product);
            jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValue();

            await reviewController.deleteReviewsOfProduct(model);

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(model);
            expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(model);
        });
    });

    describe("deleteAllReviews", () => {
        test("R_CONTROLLER_10: it should call deleteAllReviews in DAO", async () => {
            // Arrange
            const reviewController = new ReviewController();
            const deleteAllReviewsMock = jest.spyOn(ReviewDAO.prototype, 'deleteAllReviews');

            // Act
            await reviewController.deleteAllReviews();

            // Assert
            expect(deleteAllReviewsMock).toHaveBeenCalled();
        });
    });

    describe("getProductReviews", () => {

        test("R_CONTROLLER_11: It should throw ModelNotFoundError if the product doesn't exist", async () => {
            const model = "model1";
            const user: User = {
                username: "john_doe",
                name: "John",
                surname: "Doe",
                role: Role.CUSTOMER,
                address: "123 Main St",
                birthdate: "1990-01-01"
            };
            const product: Product = {
                sellingPrice: 50,
                model: "model1",
                arrivalDate: "",
                category: Category.SMARTPHONE,
                details: "",
                quantity: 50
            };
            const reviewController = new ReviewController();
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

            await expect(reviewController.getProductReviews("model1"))
                .rejects
                .toThrow(ModelNotFoundError);
        })

        
        test("R_CONTROLLER_12: It should call getProductReviews in DAO if the product exists", async () => {
            const model = "model1";
            const user: User = {
                username: "john_doe",
                name: "John",
                surname: "Doe",
                role: Role.CUSTOMER,
                address: "123 Main St",
                birthdate: "1990-01-01"
            };
            const product: Product = {
                sellingPrice: 50,
                model: "model1",
                arrivalDate: "",
                category: Category.SMARTPHONE,
                details: "",
                quantity: 50
            };
            const reviewController = new ReviewController();
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(product);
            const getProductReviewsMock = jest.spyOn(ReviewDAO.prototype, 'getProductReviews');
            const reviews: ProductReview[] = [
                { model: "model1", user: user.username, date: "2024-01-01", score: 5, comment: "Great product!" },
                { model: "model1", user: user.username, date: "2024-06-01", score: 4, comment: "Very good!" }
            ];

            jest.spyOn(ProductDAO.prototype, "getProductByModel")
           

           // Act
           await reviewController.getProductReviews(product.model);

           // Assert
           expect(getProductReviewsMock).toHaveBeenCalled();
        });
    });

});
