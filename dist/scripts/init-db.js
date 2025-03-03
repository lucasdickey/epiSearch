"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var init_js_1 = require("../lib/database/init.js");
console.log("Initializing database...");
(0, init_js_1.initializeDatabase)()
    .then(function () {
    console.log("Database initialization completed successfully");
    process.exit(0);
})
    .catch(function (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
});
