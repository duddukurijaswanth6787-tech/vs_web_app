"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffType = exports.RoleType = exports.PaymentStatus = exports.OrderStatus = exports.UserStatus = exports.EnvironmentType = void 0;
var EnvironmentType;
(function (EnvironmentType) {
    EnvironmentType["DEVELOPMENT"] = "development";
    EnvironmentType["PRODUCTION"] = "production";
    EnvironmentType["TEST"] = "test";
})(EnvironmentType || (exports.EnvironmentType = EnvironmentType = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["BLOCKED"] = "BLOCKED";
    UserStatus["PENDING"] = "PENDING";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["PLACED"] = "PLACED";
    OrderStatus["CONFIRMED"] = "CONFIRMED";
    OrderStatus["PACKED"] = "PACKED";
    OrderStatus["SHIPPED"] = "SHIPPED";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var RoleType;
(function (RoleType) {
    RoleType["SUPER_ADMIN"] = "SUPER_ADMIN";
    RoleType["MANAGER"] = "MANAGER";
    RoleType["STAFF"] = "STAFF";
    RoleType["CUSTOMER"] = "CUSTOMER";
})(RoleType || (exports.RoleType = RoleType = {}));
var StaffType;
(function (StaffType) {
    StaffType["PRODUCT_MANAGER"] = "PRODUCT_MANAGER";
    StaffType["WAREHOUSE_STAFF"] = "WAREHOUSE_STAFF";
    StaffType["PACKING_STAFF"] = "PACKING_STAFF";
    StaffType["CUSTOMER_SUPPORT"] = "CUSTOMER_SUPPORT";
    StaffType["MARKETING"] = "MARKETING";
    StaffType["ACCOUNTANT"] = "ACCOUNTANT";
})(StaffType || (exports.StaffType = StaffType = {}));
//# sourceMappingURL=index.js.map