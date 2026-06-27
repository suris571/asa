"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wait_cut_controller_1 = require("./wait-cut.controller");
const router = (0, express_1.Router)();
// เมื่อพนักงานเข้าเว็บลิงก์ /wait-cut จะวิ่งไปหาคอนโทรลเลอร์ด้านบน
router.get('/', wait_cut_controller_1.getWaitCutPage);
exports.default = router;
