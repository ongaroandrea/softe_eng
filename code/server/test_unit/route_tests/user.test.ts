import { beforeEach, describe, test, expect, jest, beforeAll, afterEach } from "@jest/globals"
import Authenticator from "../../src/routers/auth"
import request from 'supertest'
import { app } from "../../index"
import UserController from "../../src/controllers/userController"
import { Role, User } from "../../src/components/user"
import { Utility } from "../../src/utilities"
import { UserRoutes } from "../../src/routers/userRoutes"
import { resolve } from "path"

const baseURL = "/ezelectronics"
const baseURLUsers = `${baseURL}/users`
const baseURLSessions = `${baseURL}/sessions`

jest.mock("../../src/routers/auth")
jest.mock("../../src/controllers/userController")

describe("user DAO", () => {
    beforeAll(async () => {
        jest.clearAllMocks()
    })
    afterEach(async () => {
        jest.restoreAllMocks()
    })

    describe("POST / -  Route for creating a user.", () => {

        test("U_ROUTER_1 - 200 - OK", async () => {
            const user = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Customer"
            }

            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true)

            const response = await request(app).post(baseURLUsers).send(user)
            
            expect(response.status).toBe(200)
            expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(user.username,
                user.name,
                user.surname,
                user.password,
                user.role)
        })

        test("U_ROUTER_2 - 422 - missing username", async () => {
            const user = {
                name: "test",
                surname: "test",
                password: "test",
                role: "Customer"
            }

            const response = await request(app).post(baseURLUsers).send(user)
            
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "username must be non empty",
                param: "username"
              })
        })

        test("U_ROUTER_3 - 422 - missing name", async () => {
            const user = {
                username: "test",
                surname: "test",
                password: "test",
                role: "Customer"
            }

            const response = await request(app).post(baseURLUsers).send(user)
            
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "name must be non empty",
                param: "name"
              })
        })

        test("U_ROUTER_4 - 422 - missing surname", async () => {
            const user = {
                username: "test",
                name: "test",
                password: "test",
                role: "Customer"
            }

            const response = await request(app).post(baseURLUsers).send(user)
            
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "surname must be non empty",
                param: "surname"
              })
        })

        test("U_ROUTER_5 - 422 - missing password", async () => {
            const user = {
                username: "test",
                name: "test",
                surname: "test",
                role: "Customer"
            }

            const response = await request(app).post(baseURLUsers).send(user)
            
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "password must be non empty",
                param: "password"
              })
        })

        test("U_ROUTER_6 - 422 - missing role", async () => {
            const user = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
            }

            const response = await request(app).post(baseURLUsers).send(user)
            
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "role must be a string",
                param: "role"
              })
        })

        test("U_ROUTER_7 - 422 - bad role", async () => {
            const user = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Cashier"
            }

            const response = await request(app).post(baseURLUsers).send(user)
            
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "role must be one of: Manager, Customer, Admin",
                param: "role",
                value: "Cashier"
              })
        })
    })

    describe("GET / - Route for retrieving all users.", () => {
        const users : User[] = [
            {
                username: "test",
                name: "test",
                surname: "test",
                role: Role.MANAGER,
                address: "-",
                birthdate: "1900.01.01."
            }
        ]

        test("U_ROUTER_8 - 200 - OK", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(users)

            const response = await request(app).get(baseURLUsers)
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsers).toHaveBeenCalled()
            expect(response.body).toEqual(users)
        })

        test("U_ROUTER_9 - 401 error code - not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).get(baseURLUsers)
            expect(response.status).toBe(401)
        })

        test("U_ROUTER_10 - 401 error code - logged in but not admin", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).get(baseURLUsers)
            expect(response.status).toBe(401)
        })
    })

    describe("GET /roles/:role - Route for retrieving all users of a specific role.", () => {
        const users : User[] = [
            {
                username: "test",
                name: "test",
                surname: "test",
                role: Role.MANAGER,
                address: "-",
                birthdate: "1900.01.01."
            }
        ]

        test("U_ROUTER_11 - 200 - OK", async () => {
            const role = "Manager"

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(users)

            const response = await request(app).get(baseURLUsers + "/roles/" + role)
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalled()
            expect(response.body).toEqual(users)
        })

        test("U_ROUTER_12 - 422 - bad role", async () => {
            const role = "Cashier"

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).get(baseURLUsers + "/roles/" + role)
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "params",
                msg: "role must be one of: Manager, Customer, Admin",
                param: "role",
                value: "Cashier"
              })
        })

        test("U_ROUTER_13 - 401 error code - not logged in", async () => {
            const role = "Manager"

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).get(baseURLUsers + "/roles/" + role)
            expect(response.status).toBe(401)
        })

        test("U_ROUTER_14 - 401 error code - logged in but not admin", async () => {
            const role = "Manager"

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).get(baseURLUsers + "/roles/" + role)
            expect(response.status).toBe(401)
        })
    })

    describe("GET /:username - Route for retrieving a user by its username.", () => {
        const user : User = {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.CUSTOMER,
            address: "-",
            birthdate: "1900.01.01."
        }

        test("U_ROUTER_15 - 200 - OK: Admin retrievs non-admin (customer)", async () => {
            const username = "abc_customer"

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => true)
            
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(user)

            const response = await request(app).get(baseURLUsers + "/" + username)
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalled()
            expect(response.body).toEqual(user)
        })

        test("U_ROUTER_16 - 200 - OK: Non-Admin retrievs someone else that is itself", async () => {
            const username = "abc_customer"

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => false)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => true)
            
            
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(user)

            const response = await request(app).get(baseURLUsers + "/" + username)
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalled()
            expect(response.body).toEqual(user)
        })

        test("U_ROUTER_17 - 401 - Non-Admin retrievs someone else that is not itself", async () => {
            const username = "abc_customer"

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => false)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => false)
            
            
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(user)

            const response = await request(app).get(baseURLUsers + "/" + username)
            expect(response.status).toBe(401)
        })
    })

    describe("DELETE /:username - Route for deleting a user.", () => {
        const username = "test"

        test("U_ROUTER_18 - 200 - OK: Admin deletes itself", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, 'logout').mockImplementation((req: any, res: any, next: any) => {
                return new Promise((resolve, reject) => {
                    resolve(null);
                })
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => true)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => true)
            
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true)

            const response = await request(app).delete(baseURLUsers + "/" + username)
            expect(response.status).toBe(200)
            expect(UserController.prototype.deleteUser).toHaveBeenCalled()
        })

        test("U_ROUTER_19 - 200 - OK: Admin deletes non-admin", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => true)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => false)
            jest.spyOn(Authenticator.prototype, "hasRole").mockResolvedValueOnce(false) // deleted user doesn't have admin role

            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true)

            const response = await request(app).delete(baseURLUsers + "/" + username)
            expect(response.status).toBe(200)
            expect(UserController.prototype.deleteUser).toHaveBeenCalled()
        })

        test("U_ROUTER_20 - 401 - Admin deletes other admin", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => true)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => false)
            jest.spyOn(Authenticator.prototype, "hasRole").mockResolvedValueOnce(true) // deleted userhas admin role

            const response = await request(app).delete(baseURLUsers + "/" + username)
            expect(response.status).toBe(401)
        })

        test("U_ROUTER_21 - 200 - OK: Non-Admin deletes itself", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, 'logout').mockImplementation((req: any, res: any, next: any) => {
                return new Promise((resolve, reject) => {
                    resolve(null);
                })
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => false)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => true)

            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true)

            const response = await request(app).delete(baseURLUsers + "/" + username)
            expect(response.status).toBe(200)
            expect(UserController.prototype.deleteUser).toHaveBeenCalled()
        })

        test("U_ROUTER_22 - 401 - Non-Admin deletes other user", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, 'logout').mockImplementation((req: any, res: any, next: any) => {
                return new Promise((resolve, reject) => {
                    resolve(null);
                })
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => false)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => false)

            const response = await request(app).delete(baseURLUsers + "/" + username)
            expect(response.status).toBe(401)
        })
    })

    describe("DELETE / - Route for deleting all users.", () => {
        test("U_ROUTER_23 - 200 - OK", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true)

            const response = await request(app).delete(baseURLUsers)
            expect(response.status).toBe(200)
            expect(UserController.prototype.deleteAll).toHaveBeenCalled()
        })

        test("U_ROUTER_24 - 401 error code - not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).delete(baseURLUsers)
            expect(response.status).toBe(401)
        })

        test("U_ROUTER_25 - 401 error code - logged in but not admin", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).delete(baseURLUsers)
            expect(response.status).toBe(401)
        })
    })

    describe("PATCH /:username - Route for updating the information of a user.", () => {
        const username = "test"
        const user = {
            name: "test",
            surname: "test",
            address: "-",
            birthdate: "1900-01-01"
        }

        test("U_ROUTER_26 - 200 - OK: Admin edits itself", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => true)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => true)
            
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(true)

            const response = await request(app).patch(baseURLUsers + "/" + username).send(user)
            expect(response.status).toBe(200)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalled()
        })

        test("U_ROUTER_27 - 200 - OK: Admin updates non-admin", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => true)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => false)
            jest.spyOn(Authenticator.prototype, "hasRole").mockResolvedValueOnce(false) // deleted user doesn't have admin role

            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(true)

            const response = await request(app).patch(baseURLUsers + "/" + username).send(user)
            expect(response.status).toBe(200)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalled()
        })

        test("U_ROUTER_28 - 401 - Admin updates other admin", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => true)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => false)
            jest.spyOn(Authenticator.prototype, "hasRole").mockResolvedValueOnce(true) // deleted userhas admin role

            const response = await request(app).patch(baseURLUsers + "/" + username)
            expect(response.status).toBe(401)
        })

        test("U_ROUTER_29 - 200 - OK: Non-Admin updates itself", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => false)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => true)

            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(true)

            const response = await request(app).patch(baseURLUsers + "/" + username).send(user)
            expect(response.status).toBe(200)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalled()
        })

        test("U_ROUTER_30 - 401 - Non-Admin updates other user", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, 'logout').mockImplementation((req: any, res: any, next: any) => {
                return new Promise((resolve, reject) => {
                    resolve(null);
                })
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => false)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => false)

            const response = await request(app).patch(baseURLUsers + "/" + username)
            expect(response.status).toBe(401)
        })

        test("U_ROUTER_31 - 422 - Missing name", async () => {
            const user = {
                surname: "test",
                address: "-",
                birthdate: "1900-01-01"
            }

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => true)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => true)
            
            const response = await request(app).patch(baseURLUsers + "/" + username).send(user)
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "name must be non empty",
                param: "name"
              })
        })

        test("U_ROUTER_32 - 422 - Missing surname", async () => {
            const user = {
                name: "test",
                address: "-",
                birthdate: "1900-01-01"
            }

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => true)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => true)
            
            const response = await request(app).patch(baseURLUsers + "/" + username).send(user)
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "surname must be non empty",
                param: "surname"
              })
        })

        test("U_ROUTER_33 - 422 - Missing address", async () => {
            const user = {
                surname: "test",
                name: "test",
                birthdate: "1900-01-01"
            }

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => true)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => true)
            
            const response = await request(app).patch(baseURLUsers + "/" + username).send(user)
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "address must be non empty",
                param: "address"
              })
        })

        test("U_ROUTER_34 - 422 - Bad birthdate format", async () => {
            const user = {
                surname: "test",
                name: "test",
                address: "-",
                birthdate: "1900.01.01"
            }

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Utility, 'isAdmin').mockImplementation((user) => true)
            jest.spyOn(UserRoutes, 'isSameUser').mockImplementation((req: any, username: string) => true)
            
            const response = await request(app).patch(baseURLUsers + "/" + username).send(user)
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "birthdate must be of format YYYY-MM-DD",
                param: "birthdate",
                value: "1900.01.01"
              })
        })
    })

    describe("SESSIONS GET / - Route for logging in a user.", () => {
        const user = {
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Customer"
        }

        test("U_ROUTER_35 - 200 - OK", async () => {
            jest.spyOn(Authenticator.prototype, "login").mockImplementation((req: any, res: any, next: any) => {
                return new Promise((resolve, reject) => {
                    resolve(user);
                })
            })

            const response = await request(app).post(baseURLSessions + "/").send({
                username: user.username,
                password: user.password
            })
            expect(response.status).toBe(200)
        })

        test("U_ROUTER_36 - 422 - missing password", async () => {
            jest.spyOn(Authenticator.prototype, "login").mockImplementation((req: any, res: any, next: any) => {
                return new Promise((resolve, reject) => {
                    resolve(user);
                })
            })

            const response = await request(app).post(baseURLSessions + "/").send({
                username: user.username
            })
            expect(response.status).toBe(422)
        })
    })

    describe("SESSIONS GET /current - Route for retrieving the currently logged in user.", () => {
        const user = {
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Customer"
        }

        test("U_ROUTER_37 - 200 - OK", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(baseURLSessions + "/current")
            expect(response.status).toBe(200)
        })

        test("U_ROUTER_38 - 401 - not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).get(baseURLSessions + "/current")
            expect(response.status).toBe(401)
        })
    })

    describe("SESSIONS DELETE /current - Route for logging out the currently logged in user.", () => {
        const user = {
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Customer"
        }

        test("U_ROUTER_39 - 200 - OK", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, 'logout').mockImplementation((req: any, res: any, next: any) => {
                return new Promise((resolve, reject) => {
                    resolve(null);
                })
            })

            const response = await request(app).delete(baseURLSessions + "/current")
            expect(response.status).toBe(200)
        })

        test("U_ROUTER_40 - 401 - not logged in", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })

            const response = await request(app).delete(baseURLSessions + "/current")
            expect(response.status).toBe(401)
        })
    })
})
