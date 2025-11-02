import express from 'express';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.static('public'));

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend is working!',
        timestamp: new Date().toISOString()
    });
});

// Merge PDFs using pdf-lib
async function mergePDFs(pdfPaths) {
    const mergedPdf = await PDFDocument.create();
    
    for (const pdfPath of pdfPaths) {
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    const mergedPdfBytes = await mergedPdf.save();
    return mergedPdfBytes;
}

// Merge endpoint
app.post('/api/merge', upload.array('pdfs', 20), async (req, res) => {
    try {
        console.log('Received merge request');
        console.log('Files uploaded:', req.files?.length || 0);

        if (!req.files || req.files.length < 2) {
            return res.status(400).json({ error: 'Please upload at least 2 PDF files' });
        }

        const files = req.files.map(f => f.path);
        console.log('Merging PDFs:', files);

        // Merge PDFs
        const mergedPdfBytes = await mergePDFs(files);
        
        // Save to temporary file
        const outputPath = path.join(__dirname, `merged-${Date.now()}.pdf`);
        fs.writeFileSync(outputPath, mergedPdfBytes);
        
        console.log('Merge successful!');

        // Send merged PDF
        res.download(outputPath, 'merged.pdf', (err) => {
            // Clean up files
            files.forEach(file => {
                if (fs.existsSync(file)) fs.unlinkSync(file);
            });
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            
            if (err) {
                console.error('Error sending file:', err);
            } else {
                console.log('File sent successfully');
            }
        });

    } catch (error) {
        console.error('Error merging PDFs:', error);
        
        // Clean up on error
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }
        
        res.status(500).json({ error: 'Failed to merge PDFs: ' + error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✓ Backend server running on http://localhost:${PORT}`);
    console.log(`✓ Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`✓ Upload endpoint: POST http://localhost:${PORT}/api/merge`);
});