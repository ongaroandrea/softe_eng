import { describe, test, expect, beforeAll, afterEach, jest } from "@jest/globals";
import db from "../../src/db/db";
import ReviewDAO from "../../src/dao/reviewDAO";
import ProductDAO from "../../src/dao/productDAO";
import { User, Role } from "../../src/components/user";
import { ProductReview } from "../../src/components/review";


jest.mock("../../src/db/db");

describe("ReviewDAO", () => {
    let reviewDAO: ReviewDAO;
    let productDAO: ProductDAO;

    beforeAll(() => {
        reviewDAO = new ReviewDAO();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("R_DAO_01: addReview should resolve when the review is added successfully", async () => {
        const user: User = {
            username: "john_doe",
            name: "John",
            surname: "Doe",
            role: Role.CUSTOMER,
            address: "123 Main St",
            birthdate: "1990-01-01"
        };

        const model = "Product123";
        const score = 5;
        const comment = "Great product!";

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(null);
            return {} as any;
        });

        await expect(reviewDAO.addReview(model, user, score, comment)).resolves.toBeUndefined();
        mockDBRun.mockRestore();
    });

    test("R_DAO_02: addReview should throw an error when there is a database error", async () => {
        const user: User = {
            username: "john_doe",
            name: "John",
            surname: "Doe",
            role: Role.CUSTOMER,
            address: "123 Main St",
            birthdate: "1990-01-01"
        };

        const model = "Product123";
        const score = 5;
        const comment = "Great product!";

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(new Error("Database error"));
            return {} as any;
        });

        await expect(reviewDAO.addReview(model, user, score, comment)).rejects.toThrow("Database error");
        mockDBRun.mockRestore();
    });


    test("R_DAO_03: getProductReviews should resolve with an array of reviews", async () => {
        const mockRows = [
            { model: "model1", user: "john_doe", score: 5, date: "2022-01-01", comment: "Great!" },
            { model: "model1", user: "john_doe", score: 4, date: "2022-01-02", comment: "Good!" }
        ];

        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(null, mockRows);
            return {} as any;
        });

        const reviews = await reviewDAO.getProductReviews("model1");

        expect(mockDBAll).toHaveBeenCalledWith("SELECT model, username AS user, score, comment, date FROM review WHERE model = ?", ["model1"], expect.any(Function));
        expect(reviews).toHaveLength(2);
        expect(reviews[0]).toEqual(new ProductReview("model1", "john_doe", 5, "2022-01-01", "Great!"));
        expect(reviews[1]).toEqual(new ProductReview("model1", "john_doe", 4, "2022-01-02", "Good!"));
    });

    test("R_DAO_04: getProductReviews should throw an error when there is a database error", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(new Error("Database error"), null);
            return {} as any;
        });

        await expect(reviewDAO.getProductReviews("model1")).rejects.toThrow("Database error");
        mockDBAll.mockRestore();
    });


    test("R_DAO_05: deleteReview should resolve when the review is deleted successfully", async () => {
        const user: User = {
            username: "john_doe",
            name: "John",
            surname: "Doe",
            role: Role.CUSTOMER,
            address: "123 Main St",
            birthdate: "1990-01-01"
        };
        const model = "Product123";

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(null);
            return {} as any;
        });

        await expect(reviewDAO.deleteReview(model, user)).resolves.toBeUndefined();
        mockDBRun.mockRestore();
    });

    test("R_DAO_06: deleteReview should throw an error when there is a database error", async () => {
        const user: User = {
            username: "john_doe",
            name: "John",
            surname: "Doe",
            role: Role.CUSTOMER,
            address: "123 Main St",
            birthdate: "1990-01-01"
        };
        const model = "Product123";

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(new Error("Database error"));
            return {} as any;
        });

        await expect(reviewDAO.deleteReview(model, user)).rejects.toThrow("Database error");
        mockDBRun.mockRestore();
    });

    test("R_DAO_07: deleteAllReviews should resolve when all reviews are deleted successfully", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, callback: any) => {
            callback(null);
            return {} as any;
        });

        await expect(reviewDAO.deleteAllReviews()).resolves.toBeUndefined();
        mockDBRun.mockRestore();
    });

    test("R_DAO_08: deleteAllReviews should throw an error when there is a database error", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, callback: any) => {
            callback(new Error("Database error"));
            return {} as any;
        });

        await expect(reviewDAO.deleteAllReviews()).rejects.toThrow("Database error");
        mockDBRun.mockRestore();
    });

    test("R_DAO_09: deleteReviewsOfProduct should resolve when all reviews of a product are deleted successfully", async () => {
        const model = "Product123";

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(null);
            return {} as any;
        });

        await expect(reviewDAO.deleteReviewsOfProduct(model)).resolves.toBeUndefined();
        mockDBRun.mockRestore();
    });

    test("R_DAO_10: deleteReviewsOfProduct should throw an error when there is a database error", async () => {
        const model = "Product123";

        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(new Error("Database error"));
            return {} as any;
        });

        await expect(reviewDAO.deleteReviewsOfProduct(model)).rejects.toThrow("Database error");
        mockDBRun.mockRestore();
    });



    test("R_DAO_11: checkReviewExists should resolve with true if the review exists", async () => {
        const model = "Product123";
        const username = "john_doe";

        const mockRow = { count: 1 };

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(null, mockRow);
            return {} as any;
        });

        await expect(reviewDAO.checkReviewExists(model, username)).resolves.toBe(true);
        mockDBGet.mockRestore();
    });

    test("R_DAO_12: checkReviewExists should resolve with false if the review does not exist", async () => {
        const model = "Product123";
        const username = "john_doe";

        const mockRow = { count: 0 };

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(null, mockRow);
            return {} as any;
        });

        await expect(reviewDAO.checkReviewExists(model, username)).resolves.toBe(false);
        mockDBGet.mockRestore();
    });

    test("R_DAO_13: checkReviewExists should throw an error when there is a database error", async () => {
        const model = "Product123";
        const username = "john_doe";

        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: any) => {
            callback(new Error("Database error"), null);
            return {} as any;
        });

        await expect(reviewDAO.checkReviewExists(model, username)).rejects.toThrow("Database error");
        mockDBGet.mockRestore();
    });

    test("R_DAO_14: isProductBought should resolve with true if the product is bought", async () => {
        const username = "john_doe";
        const model = "model1";

        jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, { count: 1 });
            return db; // Return the mocked Database object
        });

        const result = await reviewDAO.isProductBought(username, model);
        expect(result).toBe(true);
    });

    test("R_DAO_15: isProductBought should return false if the product was not bought by the user", async () => {
        const username = "john_doe";
        const model = "model_not_bought";

        jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(null, { count: 0 });
            return db; // Return the mocked Database object
        });

        const result = await reviewDAO.isProductBought(username, model);
        expect(result).toBe(false);
    });

    test("R_DAO_16: should throw an error if there is a database error", async () => {
        const username = "john_doe";
        const model = "model_error";

        jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), null);
            return db; // Return the mocked Database object
        });

        await expect(reviewDAO.isProductBought(username, model))
            .rejects
            .toThrow("Database error");
    });

     test("R_DAO17 - should throw Error if functions in DAO throws Error", async () => {
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
            const user: User = {
                username: "john_doe",
                name: "John",
                surname: "Doe",
                role: Role.CUSTOMER,
                address: "123 Main St",
                birthdate: "1990-01-01"
            };
    
            const model = "Product123";
            const score = 5;
            const comment = "Great product!";

            await expect(ReviewDAO.prototype.addReview(model, user, score, comment )).rejects.toThrow(Error)

            await expect(ReviewDAO.prototype.getProductReviews(model)).rejects.toThrow(Error)

            await expect(ReviewDAO.prototype.deleteReview(model, user)).rejects.toThrow(Error)

            await expect(ReviewDAO.prototype.getProductReviews(model)).rejects.toThrow(Error)

            await expect(ReviewDAO.prototype.deleteReviewsOfProduct(model)).rejects.toThrow(Error)

            await expect(ReviewDAO.prototype.deleteAllReviews()).rejects.toThrow(Error)



        })

});
