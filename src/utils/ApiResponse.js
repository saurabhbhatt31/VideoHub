class ApiResponse {
  constructor(statusCode, data, message = "success") {
    (this.statusCode = statusCode),
      (this.data = data),
      (this.message = message),
      (this.success = statusCode < 400);
  }
}

const apiResponse = (res, success, status, message, data) => {
  res.status(status).send({
    success: success,
    data: data || [],
    status: status,
    message: message,
  });
};
export { ApiResponse, apiResponse };
