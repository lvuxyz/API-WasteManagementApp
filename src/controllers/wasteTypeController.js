const pool = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { createControllerLogger } = require('../utils/apiLogger');

// Tạo logger cho controller
const CONTROLLER_NAME = 'wasteTypeController';
const logger = createControllerLogger(CONTROLLER_NAME);

/**
 * Get all waste types
 */
exports.getAllWasteTypes = async (req, res, next) => {
  const FUNCTION_NAME = 'getAllWasteTypes';
  try {
    logger.logFunction(FUNCTION_NAME, 'Đang lấy tất cả loại chất thải', req);
    
    const [rows] = await pool.query('SELECT * FROM wastetypes ORDER BY name');
    
    logger.logFunction(FUNCTION_NAME, 'Lấy tất cả loại chất thải thành công', req, {
      count: rows.length
    });
    
    res.status(200).json({
      status: 'success',
      results: rows.length,
      data: {
        wasteTypes: rows
      }
    });
  } catch (error) {
    logger.logError(FUNCTION_NAME, 'Lấy tất cả loại chất thải thất bại', req, error);
    next(error);
  }
};

/**
 * Get waste type by ID
 */
exports.getWasteTypeById = async (req, res, next) => {
  const FUNCTION_NAME = 'getWasteTypeById';
  try {
    const { id } = req.params;
    
    logger.logFunction(FUNCTION_NAME, 'Đang lấy loại chất thải theo ID', req, { wasteTypeId: id });
    
    const [rows] = await pool.query(
      'SELECT * FROM wastetypes WHERE waste_type_id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      logger.logWarning(FUNCTION_NAME, 'Không tìm thấy loại chất thải với ID đã cung cấp', req, { wasteTypeId: id });
      return next(new NotFoundError('Không tìm thấy loại chất thải với ID đã cung cấp'));
    }
    
    logger.logFunction(FUNCTION_NAME, 'Lấy loại chất thải thành công', req, { 
      wasteTypeId: id,
      wasteName: rows[0].name
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        wasteType: rows[0]
      }
    });
  } catch (error) {
    logger.logError(FUNCTION_NAME, 'Lấy loại chất thải thất bại', req, error, { wasteTypeId: req.params.id });
    next(error);
  }
};

/**
 * Create new waste type
 */
exports.createWasteType = async (req, res, next) => {
  const FUNCTION_NAME = 'createWasteType';
  try {
    const { name, description, recyclable, handling_instructions, unit_price } = req.body;
    
    logger.logFunction(FUNCTION_NAME, 'Đang tạo loại chất thải mới', req, {
      name, description, recyclable, handling_instructions, unit_price
    });
    
    if (!name) {
      logger.logWarning(FUNCTION_NAME, 'Thiếu tên loại chất thải', req);
      return next(new BadRequestError('Tên loại chất thải là bắt buộc'));
    }
    
    const [result] = await pool.query(
      'INSERT INTO wastetypes (name, description, recyclable, handling_instructions, unit_price) VALUES (?, ?, ?, ?, ?)',
      [name, description, recyclable, handling_instructions, unit_price]
    );
    
    const [newWasteType] = await pool.query(
      'SELECT * FROM wastetypes WHERE waste_type_id = ?',
      [result.insertId]
    );
    
    logger.logFunction(FUNCTION_NAME, 'Tạo loại chất thải thành công', req, {
      wasteTypeId: result.insertId,
      name: newWasteType[0].name
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        wasteType: newWasteType[0]
      }
    });
  } catch (error) {
    // Duplicate entry error (name is UNIQUE)
    if (error.code === 'ER_DUP_ENTRY') {
      logger.logWarning(FUNCTION_NAME, 'Tên loại chất thải đã tồn tại', req, {
        name: req.body.name
      });
      return next(new BadRequestError('Tên loại chất thải đã tồn tại'));
    }
    logger.logError(FUNCTION_NAME, 'Tạo loại chất thải thất bại', req, error, {
      requestBody: req.body
    });
    next(error);
  }
};

/**
 * Update waste type
 */
exports.updateWasteType = async (req, res, next) => {
  const FUNCTION_NAME = 'updateWasteType';
  try {
    const { id } = req.params;
    const { name, description, recyclable, handling_instructions, unit_price } = req.body;
    
    logger.logFunction(FUNCTION_NAME, 'Đang cập nhật loại chất thải', req, {
      wasteTypeId: id,
      updateData: { name, description, recyclable, handling_instructions, unit_price }
    });
    
    // Check if waste type exists
    const [existingWasteType] = await pool.query(
      'SELECT * FROM wastetypes WHERE waste_type_id = ?',
      [id]
    );
    
    if (existingWasteType.length === 0) {
      logger.logWarning(FUNCTION_NAME, 'Không tìm thấy loại chất thải để cập nhật', req, { 
        wasteTypeId: id 
      });
      return next(new NotFoundError('Không tìm thấy loại chất thải với ID đã cung cấp'));
    }
    
    // Update the waste type
    await pool.query(
      'UPDATE wastetypes SET name = ?, description = ?, recyclable = ?, handling_instructions = ?, unit_price = ? WHERE waste_type_id = ?',
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
      'SELECT * FROM wastetypes WHERE waste_type_id = ?',
      [id]
    );
    
    logger.logFunction(FUNCTION_NAME, 'Cập nhật loại chất thải thành công', req, {
      wasteTypeId: id,
      wasteName: updatedWasteType[0].name
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        wasteType: updatedWasteType[0]
      }
    });
  } catch (error) {
    // Duplicate entry error (name is UNIQUE)
    if (error.code === 'ER_DUP_ENTRY') {
      logger.logWarning(FUNCTION_NAME, 'Tên loại chất thải đã tồn tại khi cập nhật', req, {
        name: req.body.name,
        wasteTypeId: req.params.id
      });
      return next(new BadRequestError('Tên loại chất thải đã tồn tại'));
    }
    logger.logError(FUNCTION_NAME, 'Cập nhật loại chất thải thất bại', req, error, {
      wasteTypeId: req.params.id,
      requestBody: req.body
    });
    next(error);
  }
};

/**
 * Delete waste type
 */
exports.deleteWasteType = async (req, res, next) => {
  const FUNCTION_NAME = 'deleteWasteType';
  try {
    const { id } = req.params;
    
    logger.logFunction(FUNCTION_NAME, 'Đang xóa loại chất thải', req, { wasteTypeId: id });
    
    // Check if waste type exists
    const [existingWasteType] = await pool.query(
      'SELECT * FROM wastetypes WHERE waste_type_id = ?',
      [id]
    );
    
    if (existingWasteType.length === 0) {
      logger.logWarning(FUNCTION_NAME, 'Không tìm thấy loại chất thải để xóa', req, { 
        wasteTypeId: id 
      });
      return next(new NotFoundError('Không tìm thấy loại chất thải với ID đã cung cấp'));
    }
    
    await pool.query('DELETE FROM wastetypes WHERE waste_type_id = ?', [id]);
    
    logger.logFunction(FUNCTION_NAME, 'Xóa loại chất thải thành công', req, {
      wasteTypeId: id,
      wasteName: existingWasteType[0].name
    });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    // Foreign key constraint error
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      logger.logWarning(FUNCTION_NAME, 'Không thể xóa loại chất thải vì đang được sử dụng', req, {
        wasteTypeId: req.params.id
      });
      return next(new BadRequestError('Không thể xóa loại chất thải này vì nó đang được sử dụng'));
    }
    logger.logError(FUNCTION_NAME, 'Xóa loại chất thải thất bại', req, error, {
      wasteTypeId: req.params.id
    });
    next(error);
  }
};

/**
 * Add waste type to collection point
 */
exports.addWasteTypeToCollectionPoint = async (req, res, next) => {
  const FUNCTION_NAME = 'addWasteTypeToCollectionPoint';
  try {
    const { collection_point_id, waste_type_id } = req.body;
    
    logger.logFunction(FUNCTION_NAME, 'Đang thêm loại chất thải vào điểm thu gom', req, {
      collectionPointId: collection_point_id,
      wasteTypeId: waste_type_id
    });
    
    if (!collection_point_id || !waste_type_id) {
      logger.logWarning(FUNCTION_NAME, 'Thiếu ID điểm thu gom hoặc ID loại chất thải', req);
      return next(new BadRequestError('ID điểm thu gom và ID loại chất thải là bắt buộc'));
    }
    
    // Check if collection point exists
    const [collectionPoint] = await pool.query(
      'SELECT * FROM collectionpoints WHERE collection_point_id = ?',
      [collection_point_id]
    );
    
    if (collectionPoint.length === 0) {
      logger.logWarning(FUNCTION_NAME, 'Không tìm thấy điểm thu gom', req, {
        collectionPointId: collection_point_id
      });
      return next(new NotFoundError('Không tìm thấy điểm thu gom với ID đã cung cấp'));
    }
    
    // Check if waste type exists
    const [wasteType] = await pool.query(
      'SELECT * FROM wastetypes WHERE waste_type_id = ?',
      [waste_type_id]
    );
    
    if (wasteType.length === 0) {
      logger.logWarning(FUNCTION_NAME, 'Không tìm thấy loại chất thải', req, {
        wasteTypeId: waste_type_id
      });
      return next(new NotFoundError('Không tìm thấy loại chất thải với ID đã cung cấp'));
    }
    
    // Check if association already exists
    const [existingAssociation] = await pool.query(
      'SELECT * FROM collectionpointwastetypes WHERE collection_point_id = ? AND waste_type_id = ?',
      [collection_point_id, waste_type_id]
    );
    
    if (existingAssociation.length > 0) {
      logger.logWarning(FUNCTION_NAME, 'Loại chất thải đã tồn tại trong điểm thu gom', req, {
        collectionPointId: collection_point_id,
        wasteTypeId: waste_type_id
      });
      return next(new BadRequestError('Loại chất thải này đã được thêm vào điểm thu gom'));
    }
    
    // Add association
    await pool.query(
      'INSERT INTO collectionpointwastetypes (collection_point_id, waste_type_id) VALUES (?, ?)',
      [collection_point_id, waste_type_id]
    );
    
    logger.logFunction(FUNCTION_NAME, 'Thêm loại chất thải vào điểm thu gom thành công', req, {
      collectionPointId: collection_point_id,
      wasteTypeId: waste_type_id,
      collectionPointName: collectionPoint[0].name,
      wasteTypeName: wasteType[0].name
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Đã thêm loại chất thải vào điểm thu gom thành công'
    });
  } catch (error) {
    logger.logError(FUNCTION_NAME, 'Thêm loại chất thải vào điểm thu gom thất bại', req, error, {
      collectionPointId: req.body.collection_point_id,
      wasteTypeId: req.body.waste_type_id
    });
    next(error);
  }
};

/**
 * Remove waste type from collection point
 */
exports.removeWasteTypeFromCollectionPoint = async (req, res, next) => {
  const FUNCTION_NAME = 'removeWasteTypeFromCollectionPoint';
  try {
    const { collection_point_id, waste_type_id } = req.params;
    
    logger.logFunction(FUNCTION_NAME, 'Đang xóa loại chất thải khỏi điểm thu gom', req, {
      collectionPointId: collection_point_id,
      wasteTypeId: waste_type_id
    });
    
    // Check if association exists
    const [existingAssociation] = await pool.query(
      'SELECT * FROM collectionpointwastetypes WHERE collection_point_id = ? AND waste_type_id = ?',
      [collection_point_id, waste_type_id]
    );
    
    if (existingAssociation.length === 0) {
      logger.logWarning(FUNCTION_NAME, 'Không tìm thấy liên kết giữa điểm thu gom và loại chất thải', req, {
        collectionPointId: collection_point_id,
        wasteTypeId: waste_type_id
      });
      return next(new NotFoundError('Không tìm thấy liên kết giữa điểm thu gom và loại chất thải'));
    }
    
    // Remove association
    await pool.query(
      'DELETE FROM collectionpointwastetypes WHERE collection_point_id = ? AND waste_type_id = ?',
      [collection_point_id, waste_type_id]
    );
    
    logger.logFunction(FUNCTION_NAME, 'Xóa loại chất thải khỏi điểm thu gom thành công', req, {
      collectionPointId: collection_point_id,
      wasteTypeId: waste_type_id
    });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.logError(FUNCTION_NAME, 'Xóa loại chất thải khỏi điểm thu gom thất bại', req, error, {
      collectionPointId: req.params.collection_point_id,
      wasteTypeId: req.params.waste_type_id
    });
    next(error);
  }
};

/**
 * Get all waste types for a collection point
 */
exports.getWasteTypesByCollectionPoint = async (req, res, next) => {
  const FUNCTION_NAME = 'getWasteTypesByCollectionPoint';
  try {
    const { collection_point_id } = req.params;
    
    logger.logFunction(FUNCTION_NAME, 'Đang lấy tất cả loại chất thải của điểm thu gom', req, {
      collectionPointId: collection_point_id
    });
    
    // Check if collection point exists
    const [collectionPoint] = await pool.query(
      'SELECT * FROM collectionpoints WHERE collection_point_id = ?',
      [collection_point_id]
    );
    
    if (collectionPoint.length === 0) {
      logger.logWarning(FUNCTION_NAME, 'Không tìm thấy điểm thu gom', req, {
        collectionPointId: collection_point_id
      });
      return next(new NotFoundError('Không tìm thấy điểm thu gom với ID đã cung cấp'));
    }
    
    const [wasteTypes] = await pool.query(
      `SELECT w.* 
       FROM wastetypes w 
       JOIN collectionpointwastetypes cpwt ON w.waste_type_id = cpwt.waste_type_id 
       WHERE cpwt.collection_point_id = ?`,
      [collection_point_id]
    );
    
    logger.logFunction(FUNCTION_NAME, 'Lấy loại chất thải của điểm thu gom thành công', req, {
      collectionPointId: collection_point_id,
      collectionPointName: collectionPoint[0].name,
      wasteTypeCount: wasteTypes.length
    });
    
    res.status(200).json({
      status: 'success',
      results: wasteTypes.length,
      data: {
        wasteTypes
      }
    });
  } catch (error) {
    logger.logError(FUNCTION_NAME, 'Lấy loại chất thải của điểm thu gom thất bại', req, error, {
      collectionPointId: req.params.collection_point_id
    });
    next(error);
  }
};

/**
 * Get all collection points for a waste type
 */
exports.getCollectionPointsByWasteType = async (req, res, next) => {
  const FUNCTION_NAME = 'getCollectionPointsByWasteType';
  try {
    const { waste_type_id } = req.params;
    
    logger.logFunction(FUNCTION_NAME, 'Đang lấy tất cả điểm thu gom cho loại chất thải', req, {
      wasteTypeId: waste_type_id
    });
    
    // Check if waste type exists
    const [wasteType] = await pool.query(
      'SELECT * FROM wastetypes WHERE waste_type_id = ?',
      [waste_type_id]
    );
    
    if (wasteType.length === 0) {
      logger.logWarning(FUNCTION_NAME, 'Không tìm thấy loại chất thải', req, {
        wasteTypeId: waste_type_id
      });
      return next(new NotFoundError('Không tìm thấy loại chất thải với ID đã cung cấp'));
    }
    
    const [collectionPoints] = await pool.query(
      `SELECT cp.* 
       FROM collectionpoints cp 
       JOIN collectionpointwastetypes cpwt ON cp.collection_point_id = cpwt.collection_point_id 
       WHERE cpwt.waste_type_id = ?`,
      [waste_type_id]
    );
    
    logger.logFunction(FUNCTION_NAME, 'Lấy điểm thu gom cho loại chất thải thành công', req, {
      wasteTypeId: waste_type_id,
      wasteTypeName: wasteType[0].name,
      collectionPointCount: collectionPoints.length
    });
    
    res.status(200).json({
      status: 'success',
      results: collectionPoints.length,
      data: {
        collectionPoints
      }
    });
  } catch (error) {
    logger.logError(FUNCTION_NAME, 'Lấy điểm thu gom cho loại chất thải thất bại', req, error, {
      wasteTypeId: req.params.waste_type_id
    });
    next(error);
  }
}; 