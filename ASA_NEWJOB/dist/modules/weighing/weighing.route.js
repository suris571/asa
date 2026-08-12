"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weighing_controller_1 = require("./weighing.controller");
const auth_middleware_js_1 = require("../../middleware/auth-middleware.js");
const router = (0, express_1.Router)();
// วิ่งเข้าสเปกหน้าหลักการชั่งน้ำหนัก
router.get('/', (0, auth_middleware_js_1.requirePermission)(16804), weighing_controller_1.getWeighingPage);
router.post('/save', (0, auth_middleware_js_1.requirePermission)(16804), weighing_controller_1.saveWeighingController);
router.get('/fetch-sub-rolls', (0, auth_middleware_js_1.requirePermission)(16804), weighing_controller_1.fetchweighinglist);
exports.default = router;
