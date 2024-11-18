const CART_NOT_FOUND = "Cart not found"
const PRODUCT_NOT_IN_CART = "Product not in cart"
const EMPTY_CART = "Cart is empty"

/**
 * Represents an error that occurs when a cart is not found.
 */
class CartNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = CART_NOT_FOUND
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when a product is not in a cart.
 */
class ProductNotInCartError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_NOT_IN_CART
        this.customCode = 404
    }
}

class EmptyCartError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = EMPTY_CART
        this.customCode = 400
    }
}

export { CartNotFoundError, ProductNotInCartError, EmptyCartError }