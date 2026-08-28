"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffDesignation = exports.StaffDepartment = exports.PermissionScope = exports.RoleScope = exports.LoginProvider = exports.Gender = exports.AccountStatus = exports.UserType = void 0;
var UserType;
(function (UserType) {
    UserType["CUSTOMER"] = "CUSTOMER";
    UserType["STAFF"] = "STAFF";
    UserType["ADMIN"] = "ADMIN";
    UserType["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserType || (exports.UserType = UserType = {}));
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACTIVE"] = "ACTIVE";
    AccountStatus["INACTIVE"] = "INACTIVE";
    AccountStatus["SUSPENDED"] = "SUSPENDED";
    AccountStatus["LOCKED"] = "LOCKED";
    AccountStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
    AccountStatus["DELETED"] = "DELETED";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHER";
})(Gender || (exports.Gender = Gender = {}));
var LoginProvider;
(function (LoginProvider) {
    LoginProvider["LOCAL"] = "LOCAL";
    LoginProvider["GOOGLE"] = "GOOGLE";
    LoginProvider["FACEBOOK"] = "FACEBOOK";
})(LoginProvider || (exports.LoginProvider = LoginProvider = {}));
var RoleScope;
(function (RoleScope) {
    RoleScope["GLOBAL"] = "GLOBAL";
    RoleScope["DOMAIN"] = "DOMAIN";
    RoleScope["CUSTOM"] = "CUSTOM";
})(RoleScope || (exports.RoleScope = RoleScope = {}));
var PermissionScope;
(function (PermissionScope) {
    PermissionScope["GLOBAL"] = "GLOBAL";
    PermissionScope["MODULE"] = "MODULE";
    PermissionScope["DOMAIN"] = "DOMAIN";
    PermissionScope["SELF"] = "SELF";
})(PermissionScope || (exports.PermissionScope = PermissionScope = {}));
var StaffDepartment;
(function (StaffDepartment) {
    StaffDepartment["MANAGEMENT"] = "MANAGEMENT";
    StaffDepartment["SALES"] = "SALES";
    StaffDepartment["MARKETING"] = "MARKETING";
    StaffDepartment["WAREHOUSE"] = "WAREHOUSE";
    StaffDepartment["PACKING"] = "PACKING";
    StaffDepartment["CUSTOMER_SUPPORT"] = "CUSTOMER_SUPPORT";
    StaffDepartment["INVENTORY"] = "INVENTORY";
    StaffDepartment["ACCOUNTING"] = "ACCOUNTING";
    StaffDepartment["IT"] = "IT";
})(StaffDepartment || (exports.StaffDepartment = StaffDepartment = {}));
var StaffDesignation;
(function (StaffDesignation) {
    StaffDesignation["MANAGER"] = "MANAGER";
    StaffDesignation["SUPERVISOR"] = "SUPERVISOR";
    StaffDesignation["EXECUTIVE"] = "EXECUTIVE";
    StaffDesignation["ASSOCIATE"] = "ASSOCIATE";
    StaffDesignation["TRAINEE"] = "TRAINEE";
})(StaffDesignation || (exports.StaffDesignation = StaffDesignation = {}));
//# sourceMappingURL=identity.enums.js.map