const db = require('../config/database');

class PlantAnalytics {
  // Create a new plant measurement
  static create(analyticsData) {
    return new Promise((resolve, reject) => {
      const {
        plant_name, caretaker_id, height_cm, width_cm, leaf_count, stem_diameter_mm,
        leaf_color, leaf_condition, sunlight_hours, temperature_celsius,
        humidity_percent, notes
      } = analyticsData;

      // Use NULL for empty values instead of undefined
      const query = `
        INSERT INTO plant_analytics 
        (plant_name, caretaker_id, height_cm, width_cm, leaf_count, stem_diameter_mm,
         leaf_color, leaf_condition, sunlight_hours, temperature_celsius,
         humidity_percent, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        plant_name || null,
        caretaker_id || null,
        height_cm ? parseFloat(height_cm) : null,
        width_cm ? parseFloat(width_cm) : null,
        leaf_count ? parseInt(leaf_count) : null,
        stem_diameter_mm ? parseFloat(stem_diameter_mm) : null,
        leaf_color || null,
        leaf_condition || null,
        sunlight_hours ? parseFloat(sunlight_hours) : null,
        temperature_celsius ? parseFloat(temperature_celsius) : null,
        humidity_percent ? parseFloat(humidity_percent) : null,
        notes || null
      ];

      console.log('🚀 Executing SQL query with values:', values);

      db.execute(query, values, (err, results) => {
        if (err) {
          console.error('❌ Database INSERT error:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Database INSERT successful, ID:', results.insertId);
        resolve(results.insertId);
      });
    });
  }

  // Get all analytics for a caretaker
  static getByCaretaker(caretakerId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM plant_analytics 
        WHERE caretaker_id = ?
        ORDER BY measured_at DESC
      `;

      console.log('📋 Fetching measurements for caretaker:', caretakerId);

      db.execute(query, [caretakerId], (err, results) => {
        if (err) {
          console.error('❌ Database SELECT error:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Found', results.length, 'measurements in database');
        resolve(results);
      });
    });
  }

  // Get analytics for a single plant name and caretaker
  static getByPlant(caretakerId, plantName) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM plant_analytics
        WHERE caretaker_id = ? AND plant_name = ?
        ORDER BY measured_at DESC
      `;

      console.log('📋 Fetching measurements for plant:', plantName, 'and caretaker:', caretakerId);

      db.execute(query, [caretakerId, plantName], (err, results) => {
        if (err) {
          console.error('❌ Database SELECT error:', err);
          reject(err);
          return;
        }

        console.log('✅ Found', results.length, 'measurements for plant:', plantName);
        resolve(results);
      });
    });
  }

  // Check if table exists and has data
  static checkTable() {
    return new Promise((resolve, reject) => {
      const query = `SELECT COUNT(*) as count FROM plant_analytics`;
      
      db.execute(query, (err, results) => {
        if (err) {
          console.error('❌ Table check failed:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Table exists with', results[0].count, 'records');
        resolve(results[0].count);
      });
    });
  }
}

module.exports = PlantAnalytics;