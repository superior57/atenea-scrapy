const { startScrap } = require("./scrapy");

const defaultEvent = {
  input: {
    username: "REMD1",
    password: "BlackRock@2018",
    operating_date: "25/07/2022",
    unitkey: "03FAP-PM1",
    contrasena: "REM141204513",
    certificate: "CSD_RECURRENT_ENERGY_REM141204513_20181010_114340s.cer",
    key: "CSD_RECURRENT_ENERGY_REM141204513_20181010_114340.key",
  },
};

exports.handler = async (event = defaultEvent) => {
  // TODO implement

  const data = await startScrap(event);

  console.log(data);

  const response = {
    statusCode: 200,
    body: JSON.stringify(data),
  };
  return response;
};