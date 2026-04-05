import axios from "axios";

/*
 * FUND A DREAM (SYNC FALLBACK)
 */
export function createFundDream() {
  return "created";
}

export function listFundDreams() {
  return "dreams";
}

/*
 * FUND A DREAM (FASTAPI)
 */
export const getFundDreams = async () => {
  try {
    const res = await axios.get(`${process.env.FASTAPI_URL}/dreams`);
    return res.data;
  } catch (err) {
    console.error("Error fetching dreams:", err);
    throw err;
  }
};

export const createFundDreamAsync = async (data: any) => {
  try {
    const res = await axios.post(`${process.env.FASTAPI_URL}/dreams`, data);
    return res.data;
  } catch (err) {
    console.error("Error creating dream:", err);
    throw err;
  }
};