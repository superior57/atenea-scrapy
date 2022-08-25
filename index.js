
exports.handler = async (event) => {
  const data = event;

  const response = {
    statusCode: 200,
    body: JSON.stringify(data),
  };
  return response;
};