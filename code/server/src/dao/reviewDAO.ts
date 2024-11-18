import { User } from "../components/user"
import { ProductReview } from "../components/review"
import db from "../db/db"
/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {

    /**
     * Add a new review to the database.
     * @param user - The user that is adding the review. It must not be null.
     * @param model - The model of the product that is being reviewed. It must not be null.
     * @param score - The score of the review. It must be a number between 1 and 5.
     * @param comment - The description of the review. It must not be null.
     * @returns A Promise that resolves to true if the review has been added.
     */
    addReview(model: string, user: User, score: number, comment: string) /**:Promise<Boolean> */ {
        return new Promise<void>((resolve, reject) => {
            try {
                //get the current date
                const date = new Date().toISOString().split("T")[0];
                const sql = "INSERT INTO review (model, username, score, comment, date) VALUES (?, ?, ?, ?, ?)";
                db.run(sql, [model, user.username, score, comment, date], (err: Error | null) => {
                    if (err) reject(err);
                    resolve();
                });
            } catch (error) {
                reject(error)
            }
        });
    }

    /**
     * Returns all reviews for a product.
     * @param model - The model of the product to retrieve reviews for. It must not be null.
     * @returns A Promise that resolves to an array of reviews.
     */
    getProductReviews(model: string) /**:Promise<Review[]> */ {
      
    return new Promise<ProductReview[]>((resolve, reject) => {
        try {
            const sql = "SELECT model, username AS user, score, comment, date FROM review WHERE model = ?";
            db.all(sql, [model], (err: Error | null, rows: any[]) => {
                if (err) {
                    //console.error("Error fetching reviews:", err);
                    reject(err);
                    return;
                }
                //console.log("Rows:", rows);
                const reviews: ProductReview[] = rows.map(row => new ProductReview(row.model, row.user, row.score, row.date, row.comment));
                resolve(reviews);
            });
        } catch (error) {
            reject(error);
        }
    });
}

    /**
     * Deletes a review from the database.
     * @param model - The model of the product that is being reviewed. It must not be null.
     * @param user - The user that made the review. It must not be null.
     * @returns A Promise that resolves to true if the review has been deleted.
     */
    deleteReview(model: string, user: User) /**:Promise<Boolean> */ {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM review WHERE model = ? AND username = ?";
                db.run(sql, [model, user.username], (err: Error | null) => {
                    if (err) reject(err);
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Deletes all reviews for a product.
     * @param model - The model of the product to delete reviews for. It must not be null.
     * @returns A Promise that resolves to nothing
     */
    deleteReviewsOfProduct(model: string) /**:Promise<Boolean> */ {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM review WHERE model = ?";
                db.run(sql, [model], (err: Error | null) => {
                    if (err) reject(err);
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Deletes all reviews from the database.
     * @returns A Promise that resolves to true if the reviews have been deleted.
     */
    deleteAllReviews() /**:Promise<Boolean> */ {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM review";
                db.run(sql, (err: Error | null) => {
                    if (err) reject(err);
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async checkReviewExists(model: string, username: string) {
        const checkReviewSql = "SELECT COUNT(*) AS count FROM review WHERE model = ? AND username = ?";
        return new Promise<boolean>((resolve, reject) => {
            db.get(checkReviewSql, [model, username], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                    return;
                } 
                resolve(row.count > 0);
            });
        });
    }

    async isProductBought(username: string, model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const sql = `
                SELECT COUNT(*) as count
                FROM productInCart
                WHERE username = ? AND model = ? AND paymentDate <> 'X'
            `;
            db.get(sql, [username, model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count > 0);
                }
            });
        });
    }
}
    


export default ReviewDAO;





