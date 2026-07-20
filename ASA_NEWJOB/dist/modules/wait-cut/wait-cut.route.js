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
router.get('/split-cut-set', wait_cut_controller_1.getWaitCutSplitSet);
router.post('/start-production', wait_cut_controller_1.startProduction);
router.post('/start-weighing', wait_cut_controller_1.startWeighing);
exports.default = router;
