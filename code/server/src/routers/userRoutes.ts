import express, { Router } from "express"
import Authenticator from "./auth"
import { body, param, validationResult } from "express-validator"
import { User, Role } from "../components/user"
import { Utility } from "../utilities"
import ErrorHandler from "../helper"
import UserController from "../controllers/userController"

/**
 * Represents a class that defines the routes for handling users.
 */
class UserRoutes {
    private router: Router
    private authService: Authenticator
    private errorHandler: ErrorHandler
    private controller: UserController

    /**
     * Constructs a new instance of the UserRoutes class.
     * @param authenticator The authenticator object used for authentication.
     */
    constructor(authenticator: Authenticator) {
        this.authService = authenticator
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.controller = new UserController()
        this.initRoutes()
    }

    /**
     * Get the router instance.
     * @returns The router instance.
     */
    getRouter(): Router {
        return this.router
    }

    /**
     * Initializes the routes for the user router.
     * 
     * @remarks
     * This method sets up the HTTP routes for creating, retrieving, updating, and deleting user data.
     * It can (and should!) apply authentication, authorization, and validation middlewares to protect the routes.
     */
    initRoutes() {

        /**
         * Route for creating a user.
         * It does not require authentication.
         * It requires the following body parameters:
         * - username: string. It cannot be empty and it must be unique (an existing username cannot be used to create a new user)
         * - name: string. It cannot be empty.
         * - surname: string. It cannot be empty.
         * - password: string. It cannot be empty.
         * - role: string (one of "Manager", "Customer", "Admin")
         * It returns a 200 status code.
         */
        this.router.post(
            "/",

            [
                body("username").isString().withMessage('username must be a string')
                            .notEmpty().withMessage('username must be non empty'),
                body("name").isString().withMessage('name must be a string')
                            .notEmpty().withMessage('name must be non empty'),
                body("surname").isString().withMessage('surname must be a string')
                            .notEmpty().withMessage('surname must be non empty'),
                body("password").isString().withMessage('password must be a string')
                            .notEmpty().withMessage('password must be non empty'),
                body("role").isString().withMessage('role must be a string')
                            .isIn([Role.MANAGER, Role.CUSTOMER, Role.ADMIN]).withMessage('role must be one of: Manager, Customer, Admin'),
            ],

            (req: any, res: any, next: any) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(422).json({ errors: errors.array() });
                }

                this.controller.createUser(req.body.username, req.body.name, req.body.surname, req.body.password, req.body.role)
                    .then(() => res.status(200).end())
                    .catch((err) => {
                        next(err)
                    })
            }
        )

        /**
         * Route for retrieving all users.
         * It requires the user to be logged in and to be an admin.
         * It returns an array of users.
         */
        this.router.get(
            "/",

            [
                this.authService.isLoggedIn,
                this.authService.isAdmin,
            ],

            (req: any, res: any, next: any) => this.controller.getUsers()
                .then((users: any /**User[] */) => res.status(200).json(users))
                .catch((err) => next(err))
        )

        /**
         * Route for retrieving all users of a specific role.
         * It requires the user to be logged in and to be an admin.
         * It expects the role of the users in the request parameters: the role must be one of ("Manager", "Customer", "Admin").
         * It returns an array of users.
         */
        this.router.get(
            "/roles/:role",

            [
                this.authService.isLoggedIn,
                this.authService.isAdmin,
            ],

            [
                param("role").isString().withMessage('role must be a string')
                             .isIn([Role.MANAGER, Role.CUSTOMER, Role.ADMIN]).withMessage('role must be one of: Manager, Customer, Admin'),
            ],

            (req: any, res: any, next: any) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(422).json({ errors: errors.array() });
                }

                this.controller.getUsersByRole(req.params.role)
                    .then((users: any /**User[] */) => res.status(200).json(users))
                    .catch((err) => next(err))
            }
        )

        /**
         * Route for retrieving a user by its username.
         * It requires the user to be authenticated: users with an Admin role can retrieve data of any user, users with a different role can only retrieve their own data.
         * It expects the username of the user in the request parameters: the username must represent an existing user.
         * It returns the user.
         */
        this.router.get(
            "/:username",
            [
                this.authService.isLoggedIn,
                // check that non-admin users can only retrieve their own data
                (req: any, res: any, next: any) => {
                    if (Utility.isAdmin(req.user) || UserRoutes.isSameUser(req, req.params.username)) return next()
                    return res.status(401).json({ error: "Non-Admin users can only access own user information", status: 401 })
                }
            ],

            (req: any, res: any, next: any) => this.controller.getUserByUsername(req.user, req.params.username)
                .then((user: any /**User */) => res.status(200).json(user))
                .catch((err) => next(err))
        )

        /**
         * Route for deleting a user.
         * It requires the user to be authenticated: users with an Admin role can delete the data of any user (except other Admins), users with a different role can only delete their own data.
         * It expects the username of the user in the request parameters: the username must represent an existing user.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/:username",

            [
                this.authService.isLoggedIn,
                // check that admin only have access to delete non-admin users and themself
                (req: any, res: any, next: any) => {
                    if (Utility.isAdmin(req.user) && !UserRoutes.isSameUser(req, req.params.username)) {
                        return this.authService.hasRole(req.params.username, [Role.ADMIN])
                                               .then((r) => {
                                                    return !r ? next() : res.status(401).json({ error: "Admin users can only delete non-admin users.", status: 401 });
                                                })
                    } else { return next() };
                },
                // check that non-admin only have access to delete their own data
                (req: any, res: any, next: any) => {
                    if (Utility.isAdmin(req.user) || UserRoutes.isSameUser(req, req.params.username)) return next()
                    return res.status(401).json({ error: "Non-Admin users can only delete their own data.", status: 401 })
                }
            ],

            (req: any, res: any, next: any) => this.controller.deleteUser(req.user, req.params.username)
                .then(() => {
                    // if user deleted itself, sign out
                    if (UserRoutes.isSameUser(req, req.params.username))
                        this.authService.logout(req, res, next)
                            .then(() => res.status(200).end())
                            .catch((err: any) => next(err))
                    else
                        res.status(200).end()
                })
                .catch((err: any) => next(err))
        )

        /**
         * Route for deleting all users.
         * It requires the user to be logged in and to be an admin.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/",

            [
                this.authService.isLoggedIn,
                this.authService.isAdmin,
            ],

            (req: any, res: any, next: any) => this.controller.deleteAll()
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )

        /**
         * Route for updating the information of a user.
         * It requires the user to be authenticated.
         * It expects the username of the user to edit in the request parameters: if the user is not an Admin, the username must match the username of the logged in user. Admin users can edit other non-Admin users.
         * It requires the following body parameters:
         * - name: string. It cannot be empty.
         * - surname: string. It cannot be empty.
         * - address: string. It cannot be empty.
         * - birthdate: date. It cannot be empty, it must be a valid date in format YYYY-MM-DD, and it cannot be after the current date
         * It returns the updated user.
         */
        this.router.patch(
            "/:username",

            [
                this.authService.isLoggedIn,
                // check that admin only have access to edit non-admin users and themself
                (req: any, res: any, next: any) => {
                    if (Utility.isAdmin(req.user) && !UserRoutes.isSameUser(req, req.params.username)) {
                        return this.authService.hasRole(req.params.username, [Role.ADMIN])
                                               .then((r) => {
                                                    return !r ? next() : res.status(401).json({ error: "Admin users can only edit non-admin users.", status: 401 });
                                                })
                    } else { return next() };
                },
                // check that non-admin only have access to delete their own data
                (req: any, res: any, next: any) => {
                    if (Utility.isAdmin(req.user) || UserRoutes.isSameUser(req, req.params.username)) return next()
                    return res.status(401).json({ error: "Non-Admin users can only update their own information.", status: 401 })
                }
            ],

            [
                body("name").isString().withMessage('name must be a string')
                            .notEmpty().withMessage('name must be non empty'),
                body("surname").isString().withMessage('surname must be a string')
                            .notEmpty().withMessage('surname must be non empty'),
                body("address").isString().withMessage('address must be a string')
                            .notEmpty().withMessage('address must be non empty'),
                body("birthdate").isISO8601().withMessage('birthdate must be of format YYYY-MM-DD') // validate date format is YYYY-MM-DD (ISO8601)
                                 .isDate().withMessage('birthdate must be a date')
                                 .isBefore(new Date().toISOString().split('T')[0]).withMessage('birthdate must be before current date'),
            ],

            (req: any, res: any, next: any) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    let error_code = 422
                    if (req.body.birthdate && new Date(req.body.birthdate) >= new Date())
                        error_code = 400;
                    return res.status(error_code).json({ errors: errors.array() });
                }

                this.controller.updateUserInfo(req.user, req.body.name, req.body.surname, req.body.address, req.body.birthdate, req.params.username)
                    .then((user: any /**User */) => res.status(200).json(user))
                    .catch((err: any) => next(err))
            }
        )

    }

    static isSameUser(req: any, username: string): boolean {
        return req.user.username == username;
    }
}

/**
 * Represents a class that defines the authentication routes for the application.
 */
class AuthRoutes {
    private router: Router
    private errorHandler: ErrorHandler
    private authService: Authenticator

    /**
     * Constructs a new instance of the UserRoutes class.
     * @param authenticator - The authenticator object used for authentication.
     */
    constructor(authenticator: Authenticator) {
        this.authService = authenticator
        this.errorHandler = new ErrorHandler()
        this.router = express.Router();
        this.initRoutes();
    }

    getRouter(): Router {
        return this.router
    }

    /**
     * Initializes the authentication routes.
     * 
     * @remarks
     * This method sets up the HTTP routes for login, logout, and retrieval of the logged in user.
     * It can (and should!) apply authentication, authorization, and validation middlewares to protect the routes.
     */
    initRoutes() {

        /**
         * Route for logging in a user.
         * It does not require authentication.
         * It expects the following parameters:
         * - username: string. It cannot be empty.
         * - password: string. It cannot be empty.
         * It returns an error if the username represents a non-existing user or if the password is incorrect.
         * It returns the logged in user.
         */
        this.router.post(
            "/",

            [
                body("username").isString().withMessage('username must be a string')
                            .notEmpty().withMessage('username must be non empty'),
                body("password").isString().withMessage('password must be a string')
                            .notEmpty().withMessage('password must be non empty'),
            ],

            (req: any, res: any, next: any) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(422).json({ errors: errors.array() });
                }

                this.authService.login(req, res, next)
                    .then((user: User) => res.status(200).json(user))
                    .catch((err: any) => { res.status(401).json(err) })
            }
        )

        /**
         * Route for logging out the currently logged in user.
         * It expects the user to be logged in.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/current",

            [
                this.authService.isLoggedIn,
            ],

            (req: any, res: any, next: any) => this.authService.logout(req, res, next)
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )

        /**
         * Route for retrieving the currently logged in user.
         * It expects the user to be logged in.
         * It returns the logged in user.
         */
        this.router.get(
            "/current",

            [
                this.authService.isLoggedIn,
            ],

            (req: any, res: any) => res.status(200).json(req.user)
        )
    }
}

export { UserRoutes, AuthRoutes }