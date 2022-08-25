const { startScrap } = require("./scrapy");

exports.handler = async (event) => {
  // TODO implement

  const data = await startScrap(event);

  console.log(data);

  const response = {
    statusCode: 200,
    body: JSON.stringify(data),
  };
  return response;
};