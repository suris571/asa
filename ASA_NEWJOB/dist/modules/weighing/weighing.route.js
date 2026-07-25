"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weighing_controller_1 = require("./weighing.controller");
const router = (0, express_1.Router)();
// วิ่งเข้าสเปกหน้าหลักการชั่งน้ำหนัก
router.get('/', weighing_controller_1.getWeighingPage);
router.post('/save', weighing_controller_1.saveWeighingController);
router.get('/fetch-sub-rolls', weighing_controller_1.fetchweighinglist);
exports.default = router;
