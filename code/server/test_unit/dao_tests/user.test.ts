import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"

import UserDAO from "../../src/dao/userDAO"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError";
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Role } from "../../src/components/user"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

describe("user DAO", () => {
    let userDAO: UserDAO

    beforeAll(async () => {
        jest.clearAllMocks()
        userDAO = new UserDAO()
    })
    afterEach(async () => {
        jest.restoreAllMocks()
    })

    describe("getIsUserAuthenticated",  () => {
        test("U_DAO_1 - getIsUserAuthenticated succeeds", async () => {
            const username = "abc_customer"
            const plain_password = "secret"
            const hashed_password = "hashed_secret"
            const salt = "salt"

            const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(null, {username: username, salt: salt, password: hashed_password});
                return {} as any;
            });
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((passwordHex, hashedPassword) => {
                return true // passwords match
            })

            await expect(userDAO.getIsUserAuthenticated(username, plain_password))
                .resolves
                .toBe(true)
    
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
            mockTimingSafeEqual.mockRestore()
        })

        test("U_DAO_2 - getIsUserAuthenticated fails because database no row is returned by DB", async () => {
            const username = "abc_customer"
            const plain_password = "secret"

            const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(null, null); // return no DB row
                return {} as any;
            });
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((passwordHex, hashedPassword) => {
                return true // passwords match
            })

            await expect(userDAO.getIsUserAuthenticated(username, plain_password))
                .resolves
                .toBe(false)
    
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
            mockTimingSafeEqual.mockRestore()
        })

        test("U_DAO_3 - getIsUserAuthenticated fails because passwords do not match", async () => {
            const username = "abc_customer"
            const plain_password = "secret"

            const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(null, null); // return no DB row
                return {} as any;
            });
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((passwordHex, hashedPassword) => {
                return false // passwords do NOT match
            })

            await expect(userDAO.getIsUserAuthenticated(username, plain_password))
                .resolves
                .toBe(false)
    
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
            mockTimingSafeEqual.mockRestore()
        })

        test("U_DAO_4 - getIsUserAuthenticated fails because DB error", async () => {
            const username = "abc_customer"
            const plain_password = "secret"

            const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(new Error());
                return Error() as any;
            });
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((passwordHex, hashedPassword) => {
                return false // passwords do NOT match
            })

            await expect(userDAO.getIsUserAuthenticated(username, plain_password))
                .rejects
                .toThrow(Error)
    
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
            mockTimingSafeEqual.mockRestore()
        })
    })

    describe("createUser",  () => {
        test("U_DAO_5 - createUser succeeds", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })

            await expect(userDAO.createUser("username", "name", "surname", "password", "role"))
                .resolves
                .toBe(true)

            mockDBRun.mockRestore()
            mockRandomBytes.mockRestore()
            mockScrypt.mockRestore()
        })

        test("U_DAO_6 - createUser fails because DB fails", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error());
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })

            await expect(userDAO.createUser("username", "name", "surname", "password", "role"))
                .rejects
                .toThrow(Error)

            mockDBRun.mockRestore()
            mockRandomBytes.mockRestore()
            mockScrypt.mockRestore()
        })
    })

    describe("getUserByUsername",  () => {
        test("U_DAO_7 - getUserByUsername succeeds", async () => {
            const user = {
                username: "abc_customer",
                name: "Customer",
                surname: "Abc",
                role: Role.CUSTOMER,
                address: "-",
                birthdate: "1900.01.01."
            }

            const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(null, user); // return no DB row
                return {} as any;
            });

            await expect(userDAO.getUserByUsername(user.username))
                .resolves
                .toEqual(user)
    
            mockDBRun.mockRestore()
        })

        test("U_DAO_8 - getUserByUsername fails because DB doesn't return a row", async () => {
            const username = "abc_customer"

    
            const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(null, null); // return no DB row
                return {} as any;
            });

            await expect(userDAO.getUserByUsername(username))
                .rejects
                .toThrow(UserNotFoundError)
    
            mockDBRun.mockRestore()
        })

        test("U_DAO_9 - getUserByUsername fails because DB error", async () => {
            const username = "abc_customer"

    
            const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(new Error());
                return {} as any;
            });

            await expect(userDAO.getUserByUsername(username))
                .rejects
                .toThrow(Error)
    
            mockDBRun.mockRestore()
        })
    })

    describe("getUsers",  () => {
        test("U_DAO_10 - getUsers succeeds", async () => {
            const users = [
                {
                    username: "abc_customer",
                    name: "Customer",
                    surname: "Abc",
                    role: Role.CUSTOMER,
                    address: "-",
                    birthdate: "1900.01.01."
                },
                {
                    username: "abc_admin",
                    name: "Admin",
                    surname: "Abc",
                    role: Role.ADMIN,
                    address: "-",
                    birthdate: "1900.01.01."
                }
            ]

    
            const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(null, users);
                return {} as any;
            });

            await expect(userDAO.getUsers())
                .resolves
                .toEqual(users)
    
            mockDBRun.mockRestore()
        })

        test("U_DAO_11 - getUsers fails because DB fails", async () => {    
            const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(new Error());
                return {} as any;
            });

            await expect(userDAO.getUsers())
                .rejects
                .toThrow(Error)
    
            mockDBRun.mockRestore()
        })
    })

    describe("getUsersByRole",  () => {
        test("U_DAO_12 - getUsersByRole succeeds", async () => {
            const users = [
                {
                    username: "abc_admin",
                    name: "Admin",
                    surname: "Abc",
                    role: Role.ADMIN,
                    address: "-",
                    birthdate: "1900.01.01."
                },
                {
                    username: "abc_admin2",
                    name: "Admin2",
                    surname: "Abc",
                    role: Role.ADMIN,
                    address: "-",
                    birthdate: "1900.01.01."
                }
            ]

    
            const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(null, users);
                return {} as any;
            });

            await expect(userDAO.getUsersByRole(Role.ADMIN))
                .resolves
                .toEqual(users)
    
            mockDBRun.mockRestore()
        })

        test("U_DAO_13 - getUsersByRole fails because DB fails", async () => {    
            const mockDBRun = jest.spyOn(db, "all").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(new Error());
                return {} as any;
            });

            await expect(userDAO.getUsersByRole(Role.ADMIN))
                .rejects
                .toThrow(Error)
    
            mockDBRun.mockRestore()
        })
    })

    describe("deleteUser",  () => {
        test("U_DAO_14 - deleteUser succeeds", async () => {
            const username = "abc_customer"
    
            const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((fn: any) => {
                // mock db.serialize() as identity function
                fn()
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                if (callback) {
                    callback.bind({changes: 1})(null) // bind function prototype to reflect 1 change was made 
                }
                return {} as any;
            });
            
            await expect(userDAO.deleteUser(username))
                .resolves
                .toBe(true);
            
            // 6 calls: transaction begin + transaction end + delete from tables: productInCart, cart, review, users
            expect(db.run).toHaveBeenCalledTimes(6);

            mockDBSerialize.mockRestore()
            mockDBRun.mockRestore()
        })

        test("U_DAO_15 - deleteUser fails because user not in users table", async () => {
            const username = "abc_customer"
    
            const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((fn: any) => {
                // mock db.serialize() as identity function
                fn()
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                if (callback) {
                    callback.bind({changes: 0})(null) // bind function prototype to reflect 0 change was made (user not found)
                }
                return {} as any;
            });
            
            await expect(userDAO.deleteUser(username))
                .rejects
                .toThrow(UserNotFoundError);
            
            // 6 calls: transaction begin + transaction ROLLBACK + delete from tables: productInCart, cart, review, users (attempt)
            expect(db.run).toHaveBeenCalledTimes(6);

            mockDBSerialize.mockRestore()
            mockDBRun.mockRestore()
        })

        test("U_DAO_16 - deleteUser fails because DB fail", async () => {
            let call_ct = 0
            const username = "abc_customer"
    
            const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((fn: any) => {
                // mock db.serialize() as identity function
                fn()
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                if (callback) {
                    call_ct++
                    callback.bind({changes: 0})(call_ct == 4 ? new Error() : null) // bind function prototype to reflect 0 change was made (user not found)
                }
                return {} as any;
            });
            
            await expect(userDAO.deleteUser(username))
                .rejects
                .toThrow(Error)
            
            // 6 calls: transaction begin + transaction ROLLBACK + delete from tables: productInCart, cart, review, users (attempt)
            expect(db.run).toHaveBeenCalledTimes(6);

            mockDBSerialize.mockRestore()
            mockDBRun.mockRestore()
        })
    })

    describe("updateUserInfo",  () => {
        test("U_DAO_17 - updateUserInfo succeeds", async () => {
            const user = {
                username: "abc_customer",
                name: "Customer",
                surname: "Abc",
                role: Role.CUSTOMER,
                address: "-",
                birthdate: "1900.01.01."
            }

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                callback.bind({changes: 1})(null) // bind function prototype to reflect 1 change was made
                return {} as any;
            });

            await expect(userDAO.updateUserInfo(user.name, user.surname, user.address, user.birthdate, user.username))
                .resolves
                .toBe(true)
    
            mockDBRun.mockRestore()
        })

        test("U_DAO_18 - updateUserInfo fails because user is not found", async () => {
            const user = {
                username: "abc_customer",
                name: "Customer",
                surname: "Abc",
                role: Role.CUSTOMER,
                address: "-",
                birthdate: "1900.01.01."
            }

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                callback.bind({changes: 0})(null) // bind function prototype to reflect 0 change was made (user not found)
                return {} as any;
            });

            await expect(userDAO.updateUserInfo(user.name, user.surname, user.address, user.birthdate, user.username))
                .rejects
                .toThrow(UserNotFoundError)
    
            mockDBRun.mockRestore()
        })

        test("U_DAO_19 - updateUserInfo fails because DB error", async () => {
            const user = {
                username: "abc_customer",
                name: "Customer",
                surname: "Abc",
                role: Role.CUSTOMER,
                address: "-",
                birthdate: "1900.01.01."
            }

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, params: any[], callback: any) => {
                callback(new Error())
                return {} as any;
            });

            await expect(userDAO.updateUserInfo(user.name, user.surname, user.address, user.birthdate, user.username))
                .rejects
                .toThrow(Error)
    
            mockDBRun.mockRestore()
        })
    })

    describe("deleteAllNoAdmin",  () => {
        test("U_DAO_20 - deleteAllNoAdmin succeeds", async () => {    
            const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((fn: any) => {
                // mock db.serialize() as identity function
                fn()
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, callback: any) => {
                if (callback) {
                    callback.bind({changes: 3})(null) // bind function prototype to reflect 3 changes were made 
                }
                return {} as any;
            });
            
            await expect(userDAO.deleteAllNoAdmin())
                .resolves
                .toBe(true);
            
            // 6 calls: transaction begin + transaction end + delete from tables: productInCart, cart, review, users
            expect(db.run).toHaveBeenCalledTimes(6);

            mockDBSerialize.mockRestore()
            mockDBRun.mockRestore()
        })

        test("U_DAO_21 - deleteAllNoAdmin fails because DB fail", async () => {
            let call_ct = 0
    
            const mockDBSerialize = jest.spyOn(db, "serialize").mockImplementation((fn: any) => {
                // mock db.serialize() as identity function
                fn()
            });
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql: string, callback: any) => {
                if (callback) {
                    call_ct++
                    callback.bind({changes: 0})(call_ct == 4 ? new Error() : null) // bind function prototype to reflect 0 change was made (user not found)
                }
                return {} as any;
            });
            
            await expect(userDAO.deleteAllNoAdmin())
                .rejects
                .toThrow(Error)
            
            // 6 calls: transaction begin + transaction ROLLBACK + delete from tables: productInCart, cart, review, users (attempt)
            expect(db.run).toHaveBeenCalledTimes(6);

            mockDBSerialize.mockRestore()
            mockDBRun.mockRestore()
        })
    })
})
