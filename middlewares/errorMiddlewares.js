// Classe personnalisée pour les erreurs d'API
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware pour gérer les erreurs 404 (routes non trouvées)
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route non trouvée: ${req.originalUrl}`);
  next(error);
};

// Middleware de gestion globale des erreurs
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).render('error', {
    statusCode: err.statusCode,
    message: err.message
  });
};

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler
}; 