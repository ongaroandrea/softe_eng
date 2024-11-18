import { Utility } from "../utilities"
import { User } from "../components/user";
import ReviewDAO from "../dao/reviewDAO";
import { NoReviewProductError, ExistingReviewError } from "../errors/reviewError";
import { ModelNotFoundError } from "../errors/productError";
import ProductDAO from "../dao/productDAO";
import { ProductNotInCartError } from "../errors/cartError";


class ReviewController {
    private dao: ReviewDAO;
    private dao_p: ProductDAO;

    constructor() {
        this.dao = new ReviewDAO
        this.dao_p = new ProductDAO
        
    }

    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    async addReview(model: string, user: User, score: number, comment: string) /**:Promise<void> */ { 
        try {
            // Check if the product exists
            const productExists = await this.dao_p.getProductByModel(model);
            if (!productExists) {
                throw new ModelNotFoundError();
            }
            /* Check if the product is bought by the user
            const productBought = await this.dao.isProductBought(user.username, model)
            if (!productBought) {
                throw new ProductNotInCartError();
            } */

            // Check if a review by the user for the product already exists
            const reviewExists = await this.dao.checkReviewExists(model, user.username);
            if (reviewExists) {
                throw new ExistingReviewError();
            }

            // Add the review
            await this.dao.addReview(model, user, score, comment);
        } catch (error) {
            throw error;
        }
        //return this.dao.addReview(model, user, score, comment)
    }

    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    async getProductReviews(model: string) /**:Promise<ProductReview[]> */ { 
        try{
             // Check if the product exists
            const productExists = await this.dao_p.getProductByModel(model);
            if (!productExists) {
                throw new ModelNotFoundError();
            }
            //Get product reviews 
            const reviews = await this.dao.getProductReviews(model)
            return reviews
        }catch (error) {
            throw error;
        }
       
    }

    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    async deleteReview(model: string, user: User): Promise<void> {
        try {
            const productExists = await this.dao_p.getProductByModel(model);
            if (!productExists) {
                throw new ModelNotFoundError();
            }

            const reviewExists = await this.dao.checkReviewExists(model, user.username);
            if (!reviewExists) {
                throw new NoReviewProductError();
            }

            await this.dao.deleteReview(model, user);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    async deleteReviewsOfProduct(model: string): Promise<void> {
        try {
            const productExists = await this.dao_p.getProductByModel(model);
            if (!productExists) {
                throw new ModelNotFoundError();
            }

            await this.dao.deleteReviewsOfProduct(model);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    async deleteAllReviews(): Promise<void> {
        return this.dao.deleteAllReviews();
    }
}

export default ReviewController;