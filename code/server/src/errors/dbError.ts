const DB_ERROR = "An error occurred while trying to access the database";


/**
 * Represents an error that occurs when a database error occurs.
 */
class DBError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = DB_ERROR
        this.customCode = 500
    }
}

export { DBError }