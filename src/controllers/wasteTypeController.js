const pool = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Get all waste types
 */
exports.getAllWasteTypes = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM WasteTypes ORDER BY name');
    
    res.status(200).json({
      status: 'success',
      results: rows.length,
      data: {
        wasteTypes: rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get waste type by ID
 */
exports.getWasteTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query(
      'SELECT * FROM WasteTypes WHERE waste_type_id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return next(new NotFoundError('Không tìm thấy loại chất thải với ID đã cung cấp'));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        wasteType: rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new waste type
 */
exports.createWasteType = async (req, res, next) => {
  try {
    const { name, description, recyclable, handling_instructions, unit_price } = req.body;
    
    if (!name) {
      return next(new BadRequestError('Tên loại chất thải là bắt buộc'));
    }
    
    const [result] = await pool.query(
      'INSERT INTO WasteTypes (name, description, recyclable, handling_instructions, unit_price) VALUES (?, ?, ?, ?, ?)',
      [name, description, recyclable, handling_instructions, unit_price]
    );
    
    const [newWasteType] = await pool.query(
      'SELECT * FROM WasteTypes WHERE waste_type_id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        wasteType: newWasteType[0]
      }
    });
  } catch (error) {
    // Duplicate entry error (name is UNIQUE)
    if (error.code === 'ER_DUP_ENTRY') {
      return next(new BadRequestError('Tên loại chất thải đã tồn tại'));
    }
    next(error);
  }
};

/**
 * Update waste type
 */
exports.updateWasteType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, recyclable, handling_instructions, unit_price } = req.body;
    
    // Check if waste type exists
    const [existingWasteType] = await pool.query(
      'SELECT * FROM WasteTypes WHERE waste_type_id = ?',
      [id]
    );
    
    if (existingWasteType.length === 0) {
      return next(new NotFoundError('Không tìm thấy loại chất thải với ID đã cung cấp'));
    }
    
    // Update the waste type
    await pool.query(
      'UPDATE WasteTypes SET name = ?, description = ?, recyclable = ?, handling_instructions = ?, unit_price = ? WHERE waste_type_id = ?',
      [
        name || existingWasteType[0].name,
        description !== undefined ? description : existingWasteType[0].description,
        recyclable !== undefined ? recyclable : existingWasteType[0].recyclable,
        handling_instructions !== undefined ? handling_instructions : existingWasteType[0].handling_instructions,
        unit_price !== undefined ? unit_price : existingWasteType[0].unit_price,
        id
      ]
    );
    
    const [updatedWasteType] = await pool.query(
      'SELECT * FROM WasteTypes WHERE waste_type_id = ?',
      [id]
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        wasteType: updatedWasteType[0]
      }
    });
  } catch (error) {
    // Duplicate entry error (name is UNIQUE)
    if (error.code === 'ER_DUP_ENTRY') {
      return next(new BadRequestError('Tên loại chất thải đã tồn tại'));
    }
    next(error);
  }
};

/**
 * Delete waste type
 */
exports.deleteWasteType = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if waste type exists
    const [existingWasteType] = await pool.query(
      'SELECT * FROM WasteTypes WHERE waste_type_id = ?',
      [id]
    );
    
    if (existingWasteType.length === 0) {
      return next(new NotFoundError('Không tìm thấy loại chất thải với ID đã cung cấp'));
    }
    
    await pool.query('DELETE FROM WasteTypes WHERE waste_type_id = ?', [id]);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    // Foreign key constraint error
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return next(new BadRequestError('Không thể xóa loại chất thải này vì nó đang được sử dụng'));
    }
    next(error);
  }
};

/**
 * Add waste type to collection point
 */
exports.addWasteTypeToCollectionPoint = async (req, res, next) => {
  try {
    const { collection_point_id, waste_type_id } = req.body;
    
    if (!collection_point_id || !waste_type_id) {
      return next(new BadRequestError('ID điểm thu gom và ID loại chất thải là bắt buộc'));
    }
    
    // Check if collection point exists
    const [collectionPoint] = await pool.query(
      'SELECT * FROM CollectionPoints WHERE collection_point_id = ?',
      [collection_point_id]
    );
    
    if (collectionPoint.length === 0) {
      return next(new NotFoundError('Không tìm thấy điểm thu gom với ID đã cung cấp'));
    }
    
    // Check if waste type exists
    const [wasteType] = await pool.query(
      'SELECT * FROM WasteTypes WHERE waste_type_id = ?',
      [waste_type_id]
    );
    
    if (wasteType.length === 0) {
      return next(new NotFoundError('Không tìm thấy loại chất thải với ID đã cung cấp'));
    }
    
    // Check if association already exists
    const [existingAssociation] = await pool.query(
      'SELECT * FROM CollectionPointWasteTypes WHERE collection_point_id = ? AND waste_type_id = ?',
      [collection_point_id, waste_type_id]
    );
    
    if (existingAssociation.length > 0) {
      return next(new BadRequestError('Loại chất thải này đã được thêm vào điểm thu gom'));
    }
    
    // Add association
    await pool.query(
      'INSERT INTO CollectionPointWasteTypes (collection_point_id, waste_type_id) VALUES (?, ?)',
      [collection_point_id, waste_type_id]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Đã thêm loại chất thải vào điểm thu gom thành công'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove waste type from collection point
 */
exports.removeWasteTypeFromCollectionPoint = async (req, res, next) => {
  try {
    const { collection_point_id, waste_type_id } = req.params;
    
    // Check if association exists
    const [existingAssociation] = await pool.query(
      'SELECT * FROM CollectionPointWasteTypes WHERE collection_point_id = ? AND waste_type_id = ?',
      [collection_point_id, waste_type_id]
    );
    
    if (existingAssociation.length === 0) {
      return next(new NotFoundError('Không tìm thấy liên kết giữa điểm thu gom và loại chất thải'));
    }
    
    // Remove association
    await pool.query(
      'DELETE FROM CollectionPointWasteTypes WHERE collection_point_id = ? AND waste_type_id = ?',
      [collection_point_id, waste_type_id]
    );
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all waste types for a collection point
 */
exports.getWasteTypesByCollectionPoint = async (req, res, next) => {
  try {
    const { collection_point_id } = req.params;
    
    // Check if collection point exists
    const [collectionPoint] = await pool.query(
      'SELECT * FROM CollectionPoints WHERE collection_point_id = ?',
      [collection_point_id]
    );
    
    if (collectionPoint.length === 0) {
      return next(new NotFoundError('Không tìm thấy điểm thu gom với ID đã cung cấp'));
    }
    
    const [wasteTypes] = await pool.query(
      `SELECT w.* 
       FROM WasteTypes w 
       JOIN CollectionPointWasteTypes cpwt ON w.waste_type_id = cpwt.waste_type_id 
       WHERE cpwt.collection_point_id = ?`,
      [collection_point_id]
    );
    
    res.status(200).json({
      status: 'success',
      results: wasteTypes.length,
      data: {
        wasteTypes
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all collection points for a waste type
 */
exports.getCollectionPointsByWasteType = async (req, res, next) => {
  try {
    const { waste_type_id } = req.params;
    
    // Check if waste type exists
    const [wasteType] = await pool.query(
      'SELECT * FROM WasteTypes WHERE waste_type_id = ?',
      [waste_type_id]
    );
    
    if (wasteType.length === 0) {
      return next(new NotFoundError('Không tìm thấy loại chất thải với ID đã cung cấp'));
    }
    
    const [collectionPoints] = await pool.query(
      `SELECT cp.* 
       FROM CollectionPoints cp 
       JOIN CollectionPointWasteTypes cpwt ON cp.collection_point_id = cpwt.collection_point_id 
       WHERE cpwt.waste_type_id = ?`,
      [waste_type_id]
    );
    
    res.status(200).json({
      status: 'success',
      results: collectionPoints.length,
      data: {
        collectionPoints
      }
    });
  } catch (error) {
    next(error);
  }
}; 