import axios from "axios"

export const getDreams = async () => {
  const res = await axios.get(process.env.FASTAPI_URL + "/dreams")
  return res.data
}

export const createDream = async (data: any) => {
  return axios.post(process.env.FASTAPI_URL + "/dreams", data)
}