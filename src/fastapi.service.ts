import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class FastAPIService {
  private base = process.env.FASTAPI_URL

  async getDreams() {
    return axios.get(`${this.base}/dreams`)
  }

  async createDream(data: any) {
    return axios.post(`${this.base}/dreams`, data)
  }

  async generateStory(prompt: string) {
    return axios.post(`${this.base}/ai/story`, { prompt })
  }
}