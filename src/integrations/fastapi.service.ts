import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FastAPIService {
  private readonly base: string;

  constructor() {
    this.base = process.env.FASTAPI_URL?.replace(/\/$/, '') || 'http://localhost:8000';
  }

  async getDreams() {
    const res = await axios.get(`${this.base}/dreams`);
    return res.data;
  }

  async createDream(data: any) {
    const res = await axios.post(`${this.base}/dreams`, data);
    return res.data;
  }

  async generateStory(prompt: string) {
    const res = await axios.post(`${this.base}/ai/story`, { prompt });
    return res.data;
  }

  async getAds(telegramId: string) {
    const res = await axios.get(`${this.base}/ads`, { headers: { telegram_id: telegramId } });
    return res.data;
  }
}