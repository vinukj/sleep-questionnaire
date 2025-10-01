import express from 'express';
import { getAllQuestionnaireResponses } from '../models/userModel.js';
import { verifyTokens, requireAdmin } from '../middleware/authMiddleware.js';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import { exportPatientsToExcel } from '../utils/exportPatientsToExcel.js';
const router = express.Router();

// router.get("/export/csv", async (req, res) => {
//   try {
//     const data = await getAllQuestionnaireResponses();
//     const filePath = "patients.csv";

//     await exportPatientsToExcelAsCSV(data, filePath);

//     res.download(filePath); // triggers download in browser
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error exporting CSV");
//   }
// });

router.get("/export/excel", verifyTokens, requireAdmin, async (req, res) => {
  try {
    const data = await getAllQuestionnaireResponses();
    const safeName = "patients.xlsx";
    const filePath = path.join(process.cwd(), 'temp', safeName);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await exportPatientsToExcel(data, filePath);

    res.download(filePath, safeName, (err) => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Temp cleanup failed:', e);
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error exporting Excel");
  }
});


export default router;