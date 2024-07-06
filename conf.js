import "dotenv/config";

const AirtableConf = {
  BEARER_TOKEN: process.env.BEARER_TOKEN,
  BASE_URL: process.env.BASE_URL,
  BASE_ID: process.env.BASE_ID,
  TABLE_ID: process.env.TABLE_ID,
};
export { AirtableConf };
