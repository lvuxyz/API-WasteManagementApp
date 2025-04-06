const pool = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Get all collection points
 */
exports.getAllCollectionPoints = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM CollectionPoints
      ORDER BY name
    `);
    
    res.status(200).json({
      status: 'success',
      results: rows.length,
      data: {
        collectionPoints: rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific collection point by ID
 */
exports.getCollectionPointById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT * FROM CollectionPoints WHERE collection_point_id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return next(new NotFoundError(`Không tìm thấy điểm thu gom với ID: ${id}`));
    }
    
    // Get waste types supported by this collection point
    const [wasteTypes] = await pool.execute(`
      SELECT wt.* FROM WasteTypes wt
      JOIN CollectionPointWasteTypes cpwt ON wt.waste_type_id = cpwt.waste_type_id
      WHERE cpwt.collection_point_id = ?
    `, [id]);
    
    // Get status history
    const [statusHistory] = await pool.execute(`
      SELECT * FROM CollectionPointStatusHistory
      WHERE collection_point_id = ?
      ORDER BY updated_at DESC
    `, [id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        collectionPoint: {
          ...rows[0],
          wasteTypes,
          statusHistory
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new collection point
 */
exports.createCollectionPoint = async (req, res, next) => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      operating_hours,
      capacity,
      status = 'active'
    } = req.body;
    
    // Validate required fields
    if (!name || !address || !latitude || !longitude) {
      return next(new BadRequestError('Vui lòng cung cấp name, address, latitude và longitude'));
    }
    
    // Insert collection point
    const [result] = await pool.execute(`
      INSERT INTO CollectionPoints (
        name, address, latitude, longitude, operating_hours, capacity, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, address, latitude, longitude, operating_hours, capacity, status]);
    
    // Create initial status history entry
    await pool.execute(`
      INSERT INTO CollectionPointStatusHistory (collection_point_id, status)
      VALUES (?, ?)
    `, [result.insertId, status]);
    
    // Get the created collection point
    const [newCollectionPoint] = await pool.execute(`
      SELECT * FROM CollectionPoints WHERE collection_point_id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      status: 'success',
      data: {
        collectionPoint: newCollectionPoint[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a collection point
 */
exports.updateCollectionPoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      latitude,
      longitude,
      operating_hours,
      capacity,
      current_load,
      status
    } = req.body;
    
    // Check if collection point exists
    const [existingPoints] = await pool.execute(`
      SELECT * FROM CollectionPoints WHERE collection_point_id = ?
    `, [id]);
    
    if (existingPoints.length === 0) {
      return next(new NotFoundError(`Không tìm thấy điểm thu gom với ID: ${id}`));
    }
    
    const oldStatus = existingPoints[0].status;
    
    // Build update query dynamically based on provided fields
    let updateFields = [];
    let queryParams = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      queryParams.push(name);
    }
    
    if (address !== undefined) {
      updateFields.push('address = ?');
      queryParams.push(address);
    }
    
    if (latitude !== undefined) {
      updateFields.push('latitude = ?');
      queryParams.push(latitude);
    }
    
    if (longitude !== undefined) {
      updateFields.push('longitude = ?');
      queryParams.push(longitude);
    }
    
    if (operating_hours !== undefined) {
      updateFields.push('operating_hours = ?');
      queryParams.push(operating_hours);
    }
    
    if (capacity !== undefined) {
      updateFields.push('capacity = ?');
      queryParams.push(capacity);
    }
    
    if (current_load !== undefined) {
      updateFields.push('current_load = ?');
      queryParams.push(current_load);
    }
    
    if (status !== undefined) {
      updateFields.push('status = ?');
      queryParams.push(status);
    }
    
    if (updateFields.length === 0) {
      return next(new BadRequestError('Không có dữ liệu nào để cập nhật'));
    }
    
    // Add ID as the last parameter
    queryParams.push(id);
    
    // Update collection point
    await pool.execute(`
      UPDATE CollectionPoints
      SET ${updateFields.join(', ')}
      WHERE collection_point_id = ?
    `, queryParams);
    
    // Create status history entry if status has changed
    if (status !== undefined && status !== oldStatus) {
      await pool.execute(`
        INSERT INTO CollectionPointStatusHistory (collection_point_id, status)
        VALUES (?, ?)
      `, [id, status]);
    }
    
    // Get the updated collection point
    const [updatedCollectionPoint] = await pool.execute(`
      SELECT * FROM CollectionPoints WHERE collection_point_id = ?
    `, [id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        collectionPoint: updatedCollectionPoint[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a collection point
 */
exports.deleteCollectionPoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if collection point exists
    const [existingPoints] = await pool.execute(`
      SELECT * FROM CollectionPoints WHERE collection_point_id = ?
    `, [id]);
    
    if (existingPoints.length === 0) {
      return next(new NotFoundError(`Không tìm thấy điểm thu gom với ID: ${id}`));
    }
    
    // Delete the collection point (foreign key constraints will handle related records)
    await pool.execute(`
      DELETE FROM CollectionPoints WHERE collection_point_id = ?
    `, [id]);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update collection point status
 */
exports.updateCollectionPointStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'full'].includes(status)) {
      return next(new BadRequestError('Vui lòng cung cấp trạng thái hợp lệ (active, inactive, full)'));
    }
    
    // Check if collection point exists
    const [existingPoints] = await pool.execute(`
      SELECT * FROM CollectionPoints WHERE collection_point_id = ?
    `, [id]);
    
    if (existingPoints.length === 0) {
      return next(new NotFoundError(`Không tìm thấy điểm thu gom với ID: ${id}`));
    }
    
    const oldStatus = existingPoints[0].status;
    
    // Update only if status has changed
    if (status !== oldStatus) {
      // Update collection point status
      await pool.execute(`
        UPDATE CollectionPoints
        SET status = ?
        WHERE collection_point_id = ?
      `, [status, id]);
      
      // Create status history entry
      await pool.execute(`
        INSERT INTO CollectionPointStatusHistory (collection_point_id, status)
        VALUES (?, ?)
      `, [id, status]);
    }
    
    // Get the updated collection point
    const [updatedCollectionPoint] = await pool.execute(`
      SELECT * FROM CollectionPoints WHERE collection_point_id = ?
    `, [id]);
    
    res.status(200).json({
      status: 'success',
      data: {
        collectionPoint: updatedCollectionPoint[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get status history for a collection point
 */
exports.getCollectionPointStatusHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if collection point exists
    const [existingPoints] = await pool.execute(`
      SELECT * FROM CollectionPoints WHERE collection_point_id = ?
    `, [id]);
    
    if (existingPoints.length === 0) {
      return next(new NotFoundError(`Không tìm thấy điểm thu gom với ID: ${id}`));
    }
    
    // Get status history
    const [statusHistory] = await pool.execute(`
      SELECT * FROM CollectionPointStatusHistory
      WHERE collection_point_id = ?
      ORDER BY updated_at DESC
    `, [id]);
    
    res.status(200).json({
      status: 'success',
      results: statusHistory.length,
      data: {
        statusHistory
      }
    });
  } catch (error) {
    next(error);
  }
}; 