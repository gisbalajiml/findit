import { Data } from "./Data";
import { PathConfig } from "./PathConfig";

const getInventories = (params) => {
  return new Promise((resolve, reject) => {
    const url = PathConfig.API_PATH + "/inventories";
    Data.get(url, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.data);
      }
    });
  });
};

const getSkuPrice = (payLoad) => {
  const url = PathConfig.API_PATH + "/v6price/json/priceSearch";
  const data = {
    locations: ["mb-all"],
    skus: payLoad.skus,
    limit: 200,
  };
  Data.post(url, data, (err, results) => {
    if (err) {
      return err;
    } else {
      return results;
    }
  });
};

export var V6Api = {
  getInventories: getInventories,
  getSkuPrice: getSkuPrice,
};
