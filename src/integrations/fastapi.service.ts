import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class FastAPIService {
  private readonly base = process.env.FASTAPI_URL?.replace(/\/$/, '') || 'http://localhost:8000';

  async getDreams() {
    return (await axios.get(`${this.base}/dreams`)).data;
  }

  async createDream(data: any) {
    return axios.post(`${this.base}/dreams`, data)
  }

  async generateStory(prompt: string) {
    return axios.post(`${this.base}/ai/story`, { prompt })
  }
}