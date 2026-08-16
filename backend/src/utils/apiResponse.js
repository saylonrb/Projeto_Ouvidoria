// src/utils/apiResponse.js
/**
 * Padronização de respostas da API
 */

const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

const sendCreated = (res, data = null, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

const sendPaginated = (res, data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return sendSuccess(res, data, 'Success', 200, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  });
};

module.exports = { sendSuccess, sendCreated, sendPaginated };
