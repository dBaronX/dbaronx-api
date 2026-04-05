// apps/api/src/integrations/dreams.ts
import axios from "axios";

/**
 * Simple synchronous functions (optional local usage)
 */
export function createDreamLocal() {
  return "created";
}

export function listDreamsLocal() {
  return "dreams";
}

/**
 * Async functions interacting with FastAPI backend
 */
export const getDreamsAsync = async () => {
  try {
    const res = await axios.get(${process.env.FASTAPI_URL}/dreams);
    return res.data;
  } catch (err) {
    console.error("Error fetching dreams:", err);
    throw err;
  }
};

export const createDreamAsync = async (data: any) => {
  try {
    const res = await axios.post(${process.env.FASTAPI_URL}/dreams, data);
    return res.data;
  } catch (err) {
    console.error("Error creating dream:", err);
    throw err;
  }
};