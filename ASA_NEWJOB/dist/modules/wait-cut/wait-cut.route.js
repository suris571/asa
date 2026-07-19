"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wait_cut_controller_1 = require("./wait-cut.controller");
const router = (0, express_1.Router)();
/**
 * 💻 Route สำหรับหน้าจอ (Web Interface)
 * เมื่อพนักงานเข้าลิงก์: GET /wait-cut/
 */
router.get('/', wait_cut_controller_1.getWaitCutPage);
/**
 * 📡 Route สำหรับ API สั่งตัดแยกเซ็ต (Action Endpoint)
 * เมื่อหน้าบ้านยิงคำสั่ง: POST /wait-cut/start-production
 * 🎯 แก้ไข: เปลี่ยนจาก .get เป็น .post และลบช่องว่าง (Space) ท้าย String ออกเรียบร้อย
 */
router.post('/start-production', wait_cut_controller_1.startProduction);
exports.default = router;
