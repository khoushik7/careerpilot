const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeResume, getMyResumes } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

// Configure Multer in-memory storage with file limits and type filtering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes limit
  },
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isTxt = file.mimetype === 'text/plain' || file.originalname.toLowerCase().endsWith('.txt');

    if (isPdf || isTxt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Please upload a PDF (.pdf) or text (.txt) resume file.'));
    }
  }
});

// Middleware to capture and format Multer upload errors
const handleUpload = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds maximum limit of 5MB. Please upload a smaller resume file.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

router.post('/analyze', protect, handleUpload, analyzeResume);
router.get('/my-analyses', protect, getMyResumes);

module.exports = router;
