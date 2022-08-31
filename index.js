const { startScrap } = require("./scrapy");

exports.handler = async (event, context, callback) => {
  // TODO implement

  const data = await startScrap(event);

  console.log(data);

  callback(null, data);
  return response;
};