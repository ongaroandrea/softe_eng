import { describe, test, expect, jest, beforeAll, afterAll } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { Role, User } from "../../src/components/user"
import {
    UserFieldError,
    UserNotValid
} from "../../src/errors/userError";

jest.mock("../../src/dao/userDAO")


describe("user controller", () => {

    let userController: UserController

    beforeAll(() => {
        jest.clearAllMocks()
        userController = new UserController()
    })

    afterAll(() => {
        jest.restoreAllMocks()
    })

    describe("createUser", () => {
        const testUser = {
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }

        test("U_CONTROLLER_1 - createUser succeeds", async () => {
            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
            
            await expect(userController.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role))
                    .resolves
                    .toBe(true);
        
            //Check if the createUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role);
        });

        test("U_CONTROLLER_2 - createUser fails because empty username", async () => {            
            await expect(userController.createUser("", testUser.name, testUser.surname, testUser.password, testUser.role))
                    .rejects
                    .toThrow(UserFieldError);
        });

        test("U_CONTROLLER_3 - createUser fails because empty name", async () => {            
            await expect(userController.createUser(testUser.username, "", testUser.surname, testUser.password, testUser.role))
                    .rejects
                    .toThrow(UserFieldError);
        });

        test("U_CONTROLLER_4 - createUser fails because empty surname", async () => {            
            await expect(userController.createUser(testUser.username, testUser.name, "", testUser.password, testUser.role))
                    .rejects
                    .toThrow(UserFieldError);
        });

        test("U_CONTROLLER_5 - createUser fails because empty password", async () => {            
            await expect(userController.createUser(testUser.username, testUser.name, testUser.surname, "", testUser.role))
                    .rejects
                    .toThrow(UserFieldError);
        });

        test("U_CONTROLLER_6 - createUser fails because bad role", async () => {            
            await expect(userController.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, "Cashier"))
                    .rejects
                    .toThrow(UserFieldError);
        });
    })

    describe("getUsers", () => {
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

        test("U_CONTROLLER_7 - getUsers succeeds", async () => {
            jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(users);

            await expect(userController.getUsers())
                    .resolves
                    .toEqual(users);
        
            expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
        });
    })

    describe("getUsersByRole", () => {
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

        test("U_CONTROLLER_8 - getUsersByRole succeeds", async () => {
            jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(users);
            
            await expect(userController.getUsersByRole(Role.MANAGER))
                    .resolves
                    .toEqual(users);
        
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(Role.MANAGER);
        });

        test("U_CONTROLLER_9 - getUsersByRole fails because bad role name", async () => {
            await expect(userController.getUsersByRole("Cashier"))
                    .rejects
                    .toThrow(UserFieldError);
        });
    })

    describe("getUserByUsername", () => {
        const user : User = {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "-",
            birthdate: "1900.01.01."
        }

        test("U_CONTROLLER_10 - getUserByUsername succeeds", async () => {
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user);
            
            await expect(userController.getUserByUsername(user, user.username))
                    .resolves
                    .toEqual(user);
        
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(user.username);
        });

        test("U_CONTROLLER_11 - getUserByUsername fails because empty username", async () => {
            await expect(userController.getUserByUsername(user, ""))
                    .rejects
                    .toThrow(UserFieldError);
        });
    })

    describe("deleteUser", () => {
        const user : User = {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "-",
            birthdate: "1900.01.01."
        }

        test("U_CONTROLLER_12 - deleteUser succeeds", async () => {
            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
            
            await expect(userController.deleteUser(user, user.username))
                    .resolves
                    .toBe(true);
        
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(user.username);
        });

        test("U_CONTROLLER_13 - deleteUser fails because empty username", async () => {
            await expect(userController.deleteUser(user, ""))
                    .rejects
                    .toThrow(UserFieldError);
        });
    })

    describe("deleteAll", () => {
        test("U_CONTROLLER_14 - deleteAll succeeds", async () => {
            jest.spyOn(UserDAO.prototype, "deleteAllNoAdmin").mockResolvedValueOnce(true);
            
            await expect(userController.deleteAll())
                    .resolves
                    .toBe(true);
        
            expect(UserDAO.prototype.deleteAllNoAdmin).toHaveBeenCalledTimes(1);
        });
    })

    describe("updateUserInfo", () => {
        const user : User = {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "-",
            birthdate: "2001-01-01"
        }

        test("U_CONTROLLER_15 - updateUserInfo succeeds", async () => {
            jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(true);
            
            await expect(userController.updateUserInfo(user, user.name, user.surname, user.address, user.birthdate, user.username))
                    .resolves
                    .toBe(true);
        
            //Check if the createUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(user.name,
                user.surname,
                user.address,
                user.birthdate,
                user.username);
        });

        test("U_CONTROLLER_16 - updateUserInfo fails because empty name", async () => {            
            await expect(userController.updateUserInfo(user, "", user.surname, user.address, user.birthdate, user.username))
                    .rejects
                    .toThrow(UserFieldError);
        });

        test("U_CONTROLLER_17 - updateUserInfo fails because empty surname", async () => {            
            await expect(userController.updateUserInfo(user, user.name, "", user.address, user.birthdate, user.username))
                    .rejects
                    .toThrow(UserFieldError);
        });

        test("U_CONTROLLER_18 - updateUserInfo fails because empty password", async () => {            
            await expect(userController.updateUserInfo(user, user.name, user.surname, "", user.birthdate, user.username))
                    .rejects
                    .toThrow(UserFieldError);
        });

        test("U_CONTROLLER_19 - updateUserInfo fails because bad birthdate format", async () => {            
            await expect(userController.updateUserInfo(user, user.name, user.surname, user.address, "01-01-2024", user.username))
                    .rejects
                    .toThrow(UserFieldError);
        });
    })
})
