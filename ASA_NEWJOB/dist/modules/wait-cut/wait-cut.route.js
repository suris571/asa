"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wait_cut_controller_1 = require("./wait-cut.controller");
const auth_middleware_js_1 = require("../../middleware/auth-middleware.js");
const router = (0, express_1.Router)();
/**
 * 💻 Route สำหรับหน้าจอ (Web Interface)
 * เมื่อพนักงานเข้าลิงก์: GET /wait-cut/
 */
router.get('/', (0, auth_middleware_js_1.requirePermission)(16801), wait_cut_controller_1.getWaitCutPage);
router.get('/split-cut-set', (0, auth_middleware_js_1.requirePermission)(16802), wait_cut_controller_1.getWaitCutSplitSet);
router.post('/start-production', (0, auth_middleware_js_1.requirePermission)(16802), wait_cut_controller_1.startProduction);
router.post('/swap-split-set-size', (0, auth_middleware_js_1.requirePermission)(16802), wait_cut_controller_1.swapSplitSetSize);
router.post('/start-weighing', (0, auth_middleware_js_1.requirePermission)(16802), wait_cut_controller_1.startWeighing);
router.get('/qc-close-reel', (0, auth_middleware_js_1.requirePermission)(16803), wait_cut_controller_1.qcCloseReel);
router.post('/close-reel', (0, auth_middleware_js_1.requirePermission)(16803), wait_cut_controller_1.closeReel);
router.post('/qc-close-reel/save-remark', (0, auth_middleware_js_1.requirePermission)(16803), wait_cut_controller_1.saveRemarkController);
router.get('/qc-close-reel/getModal-reel', (0, auth_middleware_js_1.requirePermission)(16803), wait_cut_controller_1.getQcReelListController);
router.post('/qc-close-reel/save-reel', (0, auth_middleware_js_1.requirePermission)(16803), wait_cut_controller_1.saveQcCloseReelController);
exports.default = router;
