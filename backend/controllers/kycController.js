const { pool } = require('../config/db');
const path = require('path');
const fs = require('fs');

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

// Helper to get relative URL path
const getRelativeUrl = (absolutePath) => {
  // Convert absolute path to relative URL path
  const uploadsIndex = absolutePath.indexOf('uploads');
  if (uploadsIndex !== -1) {
    return absolutePath.substring(uploadsIndex).replace(/\\/g, '/');
  }
  return absolutePath;
};

exports.getKYCStatus = async (req, res) => {
  try {
    console.log('🔍 Getting KYC status for user:', req.user.id);
    
    const result = await pool.query(
      `SELECT id, full_name, id_number, id_type, id_image_url, selfie_image_url, status, 
              rejection_reason, created_at, reviewed_at
       FROM kyc_submissions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      console.log('   No KYC submission found');
      return res.json(null);
    }
    
    console.log('   KYC status:', result.rows[0].status);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Get KYC status error:', error);
    res.status(500).json({ message: 'Server error while fetching KYC status' });
  }
};

exports.submitKYC = async (req, res) => {
  try {
    console.log('📝 Processing KYC Submission');
    console.log('   User ID:', req.user.id);
    console.log('   Request Body:', {
      full_name: req.body.full_name,
      id_number: req.body.id_number,
      id_type: req.body.id_type || 'passport'
    });
    
    const { full_name, id_number, id_type = 'passport' } = req.body;
    
    // Validate required fields
    if (!full_name || full_name.trim().length < 3) {
      return res.status(400).json({ 
        message: 'Full name is required (minimum 3 characters)' 
      });
    }
    
    if (!id_number || id_number.trim().length < 3) {
      return res.status(400).json({ 
        message: 'ID number is required (minimum 3 characters)' 
      });
    }
    
    // Check for files
    const id_image = req.files?.id_image?.[0];
    const selfie_image = req.files?.selfie_image?.[0];
    
    if (!id_image) {
      console.log('   ❌ Missing ID image');
      return res.status(400).json({ 
        message: 'ID image is required',
        field: 'id_image'
      });
    }
    
    if (!selfie_image) {
      console.log('   ❌ Missing selfie image');
      return res.status(400).json({ 
        message: 'Selfie image is required',
        field: 'selfie_image'
      });
    }
    
    console.log('   ✅ ID Image:', {
      filename: id_image.filename,
      size: formatFileSize(id_image.size),
      mimetype: id_image.mimetype
    });
    
    console.log('   ✅ Selfie Image:', {
      filename: selfie_image.filename,
      size: formatFileSize(selfie_image.size),
      mimetype: selfie_image.mimetype
    });
    
    // Check if user already has pending or verified KYC
    const existingRes = await pool.query(
      `SELECT id, status FROM kyc_submissions 
       WHERE user_id = $1 AND status IN ('pending', 'verified')
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    
    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      console.log('   ⚠️ User already has KYC submission with status:', existing.status);
      
      if (existing.status === 'pending') {
        return res.status(400).json({ 
          message: 'You already have a pending KYC submission. Please wait for review.',
          status: 'pending',
          existingId: existing.id
        });
      }
      if (existing.status === 'verified') {
        return res.status(400).json({ 
          message: 'Your KYC is already verified.',
          status: 'verified'
        });
      }
    }
    
    // Create relative URL paths for database storage
    const idImageUrl = getRelativeUrl(id_image.path);
    const selfieImageUrl = getRelativeUrl(selfie_image.path);
    
    console.log('   💾 Saving to database...');
    console.log('   ID Image URL:', idImageUrl);
    console.log('   Selfie Image URL:', selfieImageUrl);
    
    // Insert into database
    const result = await pool.query(
      `INSERT INTO kyc_submissions 
       (user_id, full_name, id_number, id_type, id_image_url, selfie_image_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, full_name, id_number, status, created_at`,
      [req.user.id, full_name.trim(), id_number.trim(), id_type, idImageUrl, selfieImageUrl]
    );
    
    // Update user KYC status
    await pool.query(
      `UPDATE users SET kyc_status = 'pending', updated_at = NOW() WHERE id = $1`,
      [req.user.id]
    );
    
    console.log('   ✅ KYC submitted successfully!');
    console.log('   Submission ID:', result.rows[0].id);
    
    res.status(201).json({
      message: 'KYC submitted successfully. Your documents are pending review.',
      submission: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Submit KYC error:', error);
    
    // Check for specific database errors
    if (error.code === '23505') {
      return res.status(400).json({ 
        message: 'A KYC submission already exists for this user.' 
      });
    }
    
    if (error.code === '23503') {
      return res.status(400).json({ 
        message: 'Invalid user reference.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error while submitting KYC. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optional: Add endpoint to check if files exist
exports.checkFileExists = async (req, res) => {
  try {
    const { filePath } = req.query;
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (fs.existsSync(fullPath)) {
      res.json({ exists: true, path: fullPath });
    } else {
      res.json({ exists: false, path: fullPath });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking file' });
  }
};
