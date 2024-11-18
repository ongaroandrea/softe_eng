const USER_NOT_FOUND = "The user does not exist"
const USER_FIELD_ERROR = "Invalid value for field: "
const USER_NOT_VALID_ERROR = "Invalid user"
const USER_NOT_MANAGER = "This operation can be performed only by a manager"
const USER_ALREADY_EXISTS = "The username already exists"
const USER_NOT_CUSTOMER = "This operation can be performed only by a customer"
const USER_NOT_ADMIN = "This operation can be performed only by an admin"
const USER_IS_ADMIN = "Admins cannot be deleted"
const UNAUTHORIZED_USER = "You cannot access the information of other users"

/**
 * Represents an error that occurs when a user is not found.
 */
class UserNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = USER_NOT_FOUND
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when some date of the user is incorrect.
 */
class UserFieldError extends Error {
    customMessage: string
    customCode: number

    constructor(fieldName: string, constraintMsg: string) {
        super()
        this.customMessage = USER_FIELD_ERROR + fieldName + " [" + constraintMsg + "]"
        this.customCode = 400
    }
}

/**
 * Represents an error that occurs when the username of the logged in user doesn't match with the provided.
 */
class UserNotValid extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = USER_NOT_VALID_ERROR
        this.customCode = 401
    }
}

/**
 * Represents an error that occurs when a user is not a manager.
 */
class UserNotManagerError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_NOT_MANAGER
        this.customCode = 401
    }
}

/**
 * Represents an error that occurs when a user is not a customer.
 */
class UserNotCustomerError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_NOT_CUSTOMER
        this.customCode = 401
    }
}



/**
 * Represents an error that occurs when a username is already in use.
 */
class UserAlreadyExistsError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_ALREADY_EXISTS
        this.customCode = 409
    }
}

class UserNotAdminError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_NOT_ADMIN
        this.customCode = 401
    }
}

class UserIsAdminError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = USER_IS_ADMIN
        this.customCode = 401
    }
}

class UnauthorizedUserError extends Error {
    customMessage: String;
    customCode: Number;

    constructor() {
        super()
        this.customMessage = UNAUTHORIZED_USER
        this.customCode = 401
    }
}

export { UserNotFoundError, UserFieldError, UserNotValid, UserNotManagerError, UserNotCustomerError, UserAlreadyExistsError, UserNotAdminError, UserIsAdminError, UnauthorizedUserError }