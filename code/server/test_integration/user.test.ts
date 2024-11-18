import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Category } from "../src/components/product"
import { Role } from "../src/components/user"

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer2 = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const admin2 = { username: "admin2", name: "admin2", surname: "admin2", password: "admin2", role: "Admin" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

//Helper function that deletes a new user in the database.
//Can be used to delete a user before the tests or in the tests
const deleteUser = async (user: any) => {
    // every user can delete itself (sign in first with it)
    let cookie = await login(user)
    await request(app)
        .delete(`${routePath}/users/${user.username}`)
        .set("Cookie", cookie)
}

const createAndLoginDefaultUsers = async () => {
    await postUser(admin)
    await postUser(customer)
    adminCookie = await login(admin)
    customerCookie = await login(customer)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    // create an admin and a customer in the DB
    await createAndLoginDefaultUsers()
})

//After executing tests, we remove everything from our test database
afterAll(async () => {
    await cleanup()
})

describe("User routes integration tests", () => {
    describe("POST /users", () => {
        test("U_INT_1 - It should return a 200 success code and create a new user", async () => {
            const new_customer = { username: "new_customer", name: "new_customer", surname: "new_customer", password: "new_customer", role: "Customer" }

            await request(app)
                .post(`${routePath}/users`)
                .send(new_customer)
                .expect(200)

            const users = await request(app)
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie)
                .expect(200)
            expect(users.body).toHaveLength(3)
            let cust = users.body.find((user: any) => user.username === new_customer.username)
            expect(cust).toBeDefined()
            expect(cust.name).toBe(new_customer.name)
            expect(cust.surname).toBe(new_customer.surname)
            expect(cust.role).toBe(new_customer.role)

            // remove newly created cutomer to avoid test cross-contamination
            await deleteUser(new_customer)
        })


        test("U_INT_2 - It should return a 422 error code if at least one request body parameter is empty/missing or role parameter is invalid", async () => {
            await request(app).post(`${routePath}/users`)
                              .send({ username: "", name: "test", surname: "test", password: "test", role: "Customer" })
                              .expect(422)
            await request(app).post(`${routePath}/users`)
                              .send({ username: "test", name: "", surname: "test", password: "test", role: "Customer" })
                              .expect(422)
            await request(app).post(`${routePath}/users`)
                              .send({ username: "test", name: "test", surname: "", password: "test", role: "Customer" })
                              .expect(422)
            await request(app).post(`${routePath}/users`)
                              .send({ username: "test", name: "test", surname: "test", password: "", role: "Customer" })
                              .expect(422)
            await request(app).post(`${routePath}/users`)
                              .send({ username: "test", name: "test", surname: "test", password: "test", role: "" })
                              .expect(422)
            await request(app).post(`${routePath}/users`)
                              .send({ username: "test", name: "test", surname: "test", password: "test", role: "Cashier" })
                              .expect(422)
        })
    })

    describe("GET /users", () => {
        test("U_INT_3 - It should return an array of users", async () => {
            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            expect(users.body).toHaveLength(2)
            let cust = users.body.find((user: any) => user.username === customer.username)
            expect(cust).toBeDefined()
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
            let adm = users.body.find((user: any) => user.username === admin.username)
            expect(adm).toBeDefined()
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
            expect(adm.role).toBe(admin.role)
        })

        test("U_INT_4 - Authorization errors", async () => {
            let response = await request(app).get(`${routePath}/users`)
            expect(response.status).toBe(401)
            expect(response.body.error).toEqual('Unauthenticated user')

            response = await request(app).get(`${routePath}/users`).set("Cookie", customerCookie)
            expect(response.status).toBe(401)
            expect(response.body.error).toEqual('User is not an admin')
        })
    })

    describe("GET /users/roles/:role", () => {
        test("U_INT_5 - It should return an array of users with a specific role", async () => {
            let role = 'Admin'
            let admins = await request(app).get(`${routePath}/users/roles/${role}`).set("Cookie", adminCookie).expect(200)
            expect(admins.body).toHaveLength(1) // we expect only one Admin user to be returned
            let us = admins.body[0]
            expect(us.username).toBe(admin.username)
            expect(us.name).toBe(admin.name)
            expect(us.surname).toBe(admin.surname)

            role = 'Customer'
            admins = await request(app).get(`${routePath}/users/roles/${role}`).set("Cookie", adminCookie).expect(200)
            expect(admins.body).toHaveLength(1) // we expect only one Admin user to be returned
            us = admins.body[0]
            expect(us.username).toBe(customer.username)
            expect(us.name).toBe(customer.name)
            expect(us.surname).toBe(customer.surname)
        })

        test("U_INT_6 - Request parameter errors", async () => {
            const role = 'Cashier'
            const response = await request(app).get(`${routePath}/users/roles/${role}`).set("Cookie", adminCookie)
            expect(response.status).toBe(422)
            expect(response.body.errors).toContainEqual({
                location: "params",
                msg: "role must be one of: Manager, Customer, Admin",
                param: "role",
                value: "Cashier"
              })
        })

        test("U_INT_7 - Authorization errors", async () => {
            const role = 'Admin'

            let response = await request(app).get(`${routePath}/users/roles/${role}`)
            expect(response.status).toBe(401)
            expect(response.body.error).toEqual('Unauthenticated user')

            response = await request(app).get(`${routePath}/users/roles/${role}`).set("Cookie", customerCookie)
            expect(response.status).toBe(401)
            expect(response.body.error).toEqual('User is not an admin')
        })
    })

    describe("GET /users/:username", () => {
        test("U_INT_8 - Valid retrievals", async () => {
            // admin retrievs itself
            let user_resp = await request(app).get(`${routePath}/users/${admin.username}`).set("Cookie", adminCookie).expect(200)
            let user = user_resp.body
            expect(user.username).toBe(admin.username)
            expect(user.name).toBe(admin.name)
            expect(user.surname).toBe(admin.surname)

            // admin retrievs other customer
            user_resp = await request(app).get(`${routePath}/users/${customer.username}`).set("Cookie", adminCookie).expect(200)
            user = user_resp.body
            expect(user.username).toBe(customer.username)
            expect(user.name).toBe(customer.name)
            expect(user.surname).toBe(customer.surname)

            // customer retrievs itself
            user_resp = await request(app).get(`${routePath}/users/${customer.username}`).set("Cookie", customerCookie).expect(200)
            user = user_resp.body
            expect(user.username).toBe(customer.username)
            expect(user.name).toBe(customer.name)
            expect(user.surname).toBe(customer.surname)
        })

        test("U_INT_9 - User not found", async () => {
            const username = "notexists"
            const user_resp = await request(app).get(`${routePath}/users/${username}`).set("Cookie", adminCookie)

            expect(user_resp.status).toBe(404)
            expect(user_resp.body.error).toEqual("The user does not exist")
        })

        test("U_INT_10 - Authorization errors", async () => {
            // customer retrievs other than themself
            let user_resp = await request(app).get(`${routePath}/users/${admin.username}`).set("Cookie", customerCookie).expect(401)
            expect(user_resp.body.error).toEqual('Non-Admin users can only access own user information')
        })
    })

    describe("DELETE /users/:username", () => {
        test("U_INT_11 - Valid deletions", async () => {
            // admin deletes itself
            await request(app).delete(`${routePath}/users/${admin.username}`).set("Cookie", adminCookie).expect(200)
            await postUser(admin)  // recreate admin for further tests
            adminCookie = await login(admin) // relogin with admin

            // customer deletes itself
            await postUser(customer2)  // create other customer
            const customer2Cookie = await login(customer2)
            await request(app).delete(`${routePath}/users/${customer2.username}`).set("Cookie", customer2Cookie).expect(200)

            // admin deletes cutomer
            await postUser(customer2)  // create other customer
            await request(app).delete(`${routePath}/users/${customer2.username}`).set("Cookie", adminCookie).expect(200)
        })

        test("U_INT_12 - User not found", async () => {
            const username = "notexists"
            const user_resp = await request(app).delete(`${routePath}/users/${username}`).set("Cookie", adminCookie)

            expect(user_resp.status).toBe(404)
            expect(user_resp.body.error).toEqual("The user does not exist")
        })

        test("U_INT_13 - Authorization errors", async () => {
            // customer deletes other than himself
            let user_resp = await request(app).delete(`${routePath}/users/${admin.username}`).set("Cookie", customerCookie).expect(401)
            expect(user_resp.body.error).toEqual('Non-Admin users can only delete their own data.')

            // admin deletes other admin
            await postUser(admin2)  // create admin2
            user_resp = await request(app).delete(`${routePath}/users/${admin2.username}`).set("Cookie", adminCookie).expect(401)
            expect(user_resp.body.error).toEqual('Admin users can only delete non-admin users.')
            await deleteUser(admin2) // delete admin2
        })
    })

    describe("DELETE /users", () => {
        test("U_INT_14 - It should delete all non-admin users", async () => {
            await request(app).delete(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            
            // get all users to check only admins are returned
            const users = await request(app)
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie)
                .expect(200)

            // check that non-admins are absent
            const vals = users.body.filter((user: any) => user.role !== Role.ADMIN)
            expect(vals.length === 0)
        })

        test("U_INT_15 - Authorization errors", async () => {
            let response = await request(app).delete(`${routePath}/users`)
            expect(response.status).toBe(401)
            expect(response.body.error).toEqual('Unauthenticated user')

            response = await request(app).delete(`${routePath}/users`).set("Cookie", customerCookie)
            expect(response.status).toBe(401)
            expect(response.body.error).toEqual('User is not an admin')
        })
    })
    
    describe("PATCH /users/:username", () => {
        const new_address = '-'
        const new_birthdate = '1900-01-01'

        test("U_INT_16 - Valid updates", async () => {
            // admin updates itself
            await request(app).patch(`${routePath}/users/${admin.username}`)
                              .send({...admin, address: new_address, birthdate: new_birthdate})
                              .set("Cookie", adminCookie)
                              .expect(200)
            // check updated values
            let response = await request(app).get(`${routePath}/users/${admin.username}`)
                                            .set("Cookie", adminCookie)
                                            .expect(200)
            let user_data = response.body
            expect(user_data).toBeDefined()
            expect(user_data.username).toBe(admin.username)
            expect(user_data.name).toBe(admin.name)
            expect(user_data.surname).toBe(admin.surname)
            expect(user_data.role).toBe(admin.role)
            expect(user_data.address).toBe(new_address)
            expect(user_data.birthdate).toBe(new_birthdate)

            // customer updates itself
            await postUser(customer2)  // create other customer
            const customer2Cookie = await login(customer2)
            await request(app).patch(`${routePath}/users/${customer2.username}`)
                              .send({...customer2, address: new_address, birthdate: new_birthdate})
                              .set("Cookie", customer2Cookie)
                              .expect(200)
            // check updated values
            response = await request(app).get(`${routePath}/users/${customer2.username}`)
                                            .set("Cookie", adminCookie)
                                            .expect(200)
            user_data = response.body
            expect(user_data).toBeDefined()
            expect(user_data.username).toBe(customer2.username)
            expect(user_data.name).toBe(customer2.name)
            expect(user_data.surname).toBe(customer2.surname)
            expect(user_data.role).toBe(customer2.role)
            expect(user_data.address).toBe(new_address)
            expect(user_data.birthdate).toBe(new_birthdate)
            await deleteUser(customer2)  // delete customer

            // admin updates cutomer
            await postUser(customer2)  // create other customer
            await request(app).patch(`${routePath}/users/${customer2.username}`)
                              .send({...customer2, address: new_address, birthdate: new_birthdate})
                              .set("Cookie", adminCookie)
                              .expect(200)
            // check updated values
            response = await request(app).get(`${routePath}/users/${customer2.username}`)
                                            .set("Cookie", adminCookie)
                                            .expect(200)
            user_data = response.body
            expect(user_data).toBeDefined()
            expect(user_data.username).toBe(customer2.username)
            expect(user_data.name).toBe(customer2.name)
            expect(user_data.surname).toBe(customer2.surname)
            expect(user_data.role).toBe(customer2.role)
            expect(user_data.address).toBe(new_address)
            expect(user_data.birthdate).toBe(new_birthdate)
            await deleteUser(customer2)  // delete customer
        })

        test("U_INT_17 - Invalid parameters", async () => {
            // missing name
            let user_resp = await request(app).patch(`${routePath}/users/${admin.username}`)
                                                .send({
                                                    surname: admin.surname,
                                                    address: new_address,
                                                    birthdate: new_birthdate
                                                })
                                                .set("Cookie", adminCookie)
            expect(user_resp.status).toBe(422)
            expect(user_resp.body.errors).toContainEqual({
                location: "body",
                msg: "name must be non empty",
                param: "name"
            })

            // missing surname
            user_resp = await request(app).patch(`${routePath}/users/${admin.username}`)
                                                .send({
                                                    name: admin.name,
                                                    address: new_address,
                                                    birthdate: new_birthdate
                                                })
                                                .set("Cookie", adminCookie)
            expect(user_resp.status).toBe(422)
            expect(user_resp.body.errors).toContainEqual({
                location: "body",
                msg: "surname must be non empty",
                param: "surname"
            })

            // missing address
            user_resp = await request(app).patch(`${routePath}/users/${admin.username}`)
                                                .send({
                                                    name: admin.name,
                                                    surname: admin.surname,
                                                    birthdate: new_birthdate
                                                })
                                                .set("Cookie", adminCookie)
            expect(user_resp.status).toBe(422)
            expect(user_resp.body.errors).toContainEqual({
                location: "body",
                msg: "address must be non empty",
                param: "address"
            })

            // missing birthdate
            user_resp = await request(app).patch(`${routePath}/users/${admin.username}`)
                                                .send({
                                                    name: admin.name,
                                                    surname: admin.surname,
                                                    address: new_address,
                                                })
                                                .set("Cookie", adminCookie)
            expect(user_resp.status).toBe(422)
            expect(user_resp.body.errors).toContainEqual({
                location: "body",
                msg: "birthdate must be a date",
                param: "birthdate"
            })

            // bad birthdate format
            user_resp = await request(app).patch(`${routePath}/users/${admin.username}`)
                                                .send({
                                                    name: admin.name,
                                                    surname: admin.surname,
                                                    address: new_address,
                                                    birthdate: "1900.01.01"
                                                })
                                                .set("Cookie", adminCookie)
            expect(user_resp.status).toBe(422)
            expect(user_resp.body.errors).toContainEqual({
                location: "body",
                msg: "birthdate must be of format YYYY-MM-DD",
                param: "birthdate",
                value: "1900.01.01"
            })

            // birthdate not before current date
            user_resp = await request(app).patch(`${routePath}/users/${admin.username}`)
                                                .send({
                                                    name: admin.name,
                                                    surname: admin.surname,
                                                    address: new_address,
                                                    birthdate: "2025-01-01"
                                                })
                                                .set("Cookie", adminCookie)
            expect(user_resp.status).toBe(400)
            expect(user_resp.body.errors).toContainEqual({
                location: "body",
                msg: "birthdate must be before current date",
                param: "birthdate",
                value: "2025-01-01"
            })
        })

        test("U_INT_18 - User not found", async () => {
            const username = "notexists"
            const user_resp = await request(app).patch(`${routePath}/users/${username}`)
                                                .send({...admin, address: new_address, birthdate: new_birthdate})
                                                .set("Cookie", adminCookie)

            expect(user_resp.status).toBe(404)
            expect(user_resp.body.error).toEqual("The user does not exist")
        })

        test("U_INT_19 - Authorization errors", async () => {
            // customer updates other than himself
            let user_resp = await request(app).patch(`${routePath}/users/${admin.username}`)
                                              .send({...admin, address: new_address, birthdate: new_birthdate})
                                              .set("Cookie", customerCookie)
                                              .expect(401)
            expect(user_resp.body.error).toEqual('Non-Admin users can only update their own information.')

            // admin deletes other admin
            await postUser(admin2)  // create admin2
            user_resp = await request(app).patch(`${routePath}/users/${admin2.username}`)
                                              .send({...admin2, address: new_address, birthdate: new_birthdate})
                                              .set("Cookie", adminCookie)
                                              .expect(401)
            expect(user_resp.body.error).toEqual('Admin users can only edit non-admin users.')
            await deleteUser(admin2) // delete admin2
        })
    })

    describe("SESSIONS POST /sessions", () => {
        test("U_INT_20 - It should login", async () => {
            let response = await request(app).post(`${routePath}/sessions`)
                        .send(admin)
                        .expect(200)

            let user_data = response.body
            expect(user_data).toBeDefined()
            expect(user_data.username).toBe(admin.username)
            expect(user_data.name).toBe(admin.name)
            expect(user_data.surname).toBe(admin.surname)
        })

        test("U_INT_21 - Wrong parameters", async () => {
            let response = await request(app).post(`${routePath}/sessions`)
                        .send({
                            username: admin.username
                        })
                        .expect(422)

            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "password must be non empty",
                param: "password"
            })

            response = await request(app).post(`${routePath}/sessions`)
                        .send({
                            password: admin.password
                        })
                        .expect(422)

            expect(response.body.errors).toContainEqual({
                location: "body",
                msg: "username must be non empty",
                param: "username"
            })
        })
    })

    describe("SESSIONS DELETE /sessions/current", () => {
        test("U_INT_22 - It should logout", async () => {
            await postUser(customer2)
            const cookie = await login(customer2)
            await request(app).delete(`${routePath}/sessions/current`)
                              .set("Cookie", cookie)
                              .expect(200)
            await deleteUser(customer2)
        })

        test("U_INT_23 - Not logged in", async () => {
            await request(app).delete(`${routePath}/sessions/current`)
                              .expect(401)
        })
    })

    describe("SESSIONS DELETE /sessions/current", () => {
        test("U_INT_24 - It should get logged in user info", async () => {
            await postUser(customer2)
            const cookie = await login(customer2)
            let response = await request(app).get(`${routePath}/sessions/current`)
                        .set("Cookie", cookie)
                        .expect(200)
    
            let user_data = response.body
            expect(user_data).toBeDefined()
            expect(user_data.username).toBe(customer2.username)
            expect(user_data.name).toBe(customer2.name)
            expect(user_data.surname).toBe(customer2.surname)

            await deleteUser(customer2)
        })

        test("U_INT_25 - Not logged in", async () => {
            await request(app).get(`${routePath}/sessions/current`)
                              .expect(401)
        })
    })
})
