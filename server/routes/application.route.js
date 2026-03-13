import express from "express";
import { createApplication, getApplications, getApplication, updateApplicationStatus } from '../controller/application.controller.js';
import { verifyToken } from '../middelware/jwt.js';

const router = express.Router();

router.post('/', verifyToken, createApplication);
router.get('/', verifyToken, getApplications);
router.get('/:id', verifyToken, getApplication);
router.patch('/:id/status', verifyToken, updateApplicationStatus);

export default router;
