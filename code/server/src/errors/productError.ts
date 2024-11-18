const PRODUCT_NOT_FOUND = "Product not found"
const PRODUCT_ALREADY_EXISTS = "The product already exists"
const LOW_PRODUCT_STOCK = "Product stock cannot satisfy the requested quantity"
const ARRIVAL_DATE_NOT_VALID = "Arrival date must be a valid date in the format YYYY-MM-DD that is not after the current date"
const MODEL_NOT_FOUND = "Model not found"
const GROUPING_NOT_VALID = "Grouping is not valid"

/**
 * Represents an error that occurs when a product is not found.
 */
class ProductNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_NOT_FOUND
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when a product id already exists.
 */
class ProductAlreadyExistsError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_ALREADY_EXISTS
        this.customCode = 409
    }
}

/**
 * Represents an error that occurs when a product is already sold.
 */

class LowProductStockError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = LOW_PRODUCT_STOCK
        this.customCode = 409
    }
}



class ArrivalDateNotValidError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = ARRIVAL_DATE_NOT_VALID
        this.customCode = 400
    }
}

class ModelNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = MODEL_NOT_FOUND
        this.customCode = 404
    }
}

class GroupingNotValidError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = GROUPING_NOT_VALID
        this.customCode = 422
    }
}

export {
    ProductNotFoundError,
    ProductAlreadyExistsError,
    LowProductStockError,
    ArrivalDateNotValidError,
    ModelNotFoundError,
    GroupingNotValidError
}
