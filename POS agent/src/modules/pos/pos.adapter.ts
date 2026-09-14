import axios from 'axios';
import logger from '../../infrastructure/logger';
import { APP_CONFIG } from '../../config/app';
import { withRetry } from '../../infrastructure/error-handler';
import { CircuitBreaker } from '../../infrastructure/retry';

interface POSResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface POSProduct {
  id: number;
  name: string;
  selling_price: number;
  stock_quantity: number;
  minimum_stock: number;
  category_name?: string;
  barcode?: string;
  unit?: string;
  image_url?: string;
}

interface POSOrder {
  id: number;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  items?: any[];
}

interface POSSale {
  id: number;
  total_amount: number;
  created_at: string;
  customer_name?: string;
  items?: any[];
}

interface POSCustomer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  debt_amount?: number;
}

class POSAdapter {
  private baseURL: string;
  private apiKey: string;
  private circuitBreaker: CircuitBreaker<POSResponse>;
  private healthStatus: Record<string, any> = {};

  constructor() {
    this.baseURL = APP_CONFIG.posApiUrl;
    this.apiKey = APP_CONFIG.posApiKey;
    this.circuitBreaker = new CircuitBreaker<POSResponse>(5, 30000);
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Request-ID': this.generateRequestId(),
    };
  }

  private generateRequestId(): string {
    const crypto = require('crypto');
    return `pos_${crypto.randomBytes(8).toString('hex')}`;
  }

  async getProducts(): Promise<POSResponse<POSProduct[]>> {
    return this.circuitBreaker.call(() => this.get('/products'));
  }

  async getProduct(id: number): Promise<POSResponse<POSProduct>> {
    return this.circuitBreaker.call(() => this.get(`/products/${id}`));
  }

  async getOrders(limit = 20): Promise<POSResponse<POSOrder[]>> {
    return this.circuitBreaker.call(() => this.get(`/orders?limit=${limit}`));
  }

  async getOrder(id: number): Promise<POSResponse<POSOrder>> {
    return this.circuitBreaker.call(() => this.get(`/orders/${id}`));
  }

  async getSales(period = 'today'): Promise<POSResponse<POSSale[]>> {
    return this.circuitBreaker.call(() => this.get(`/sales?period=${period}`));
  }

  async getInventory(): Promise<POSResponse<POSProduct[]>> {
    return this.circuitBreaker.call(() => this.get('/inventory'));
  }

  async getCustomers(): Promise<POSResponse<POSCustomer[]>> {
    return this.circuitBreaker.call(() => this.get('/customers'));
  }

  async getSalesSummary(period = 'today'): Promise<POSResponse<any>> {
    return this.circuitBreaker.call(() => this.get(`/sales/summary?period=${period}`));
  }

  async createOrder(data: any): Promise<POSResponse<POSOrder>> {
    return this.circuitBreaker.call(() => this.post('/orders', data));
  }

  async updateProduct(id: number, data: any): Promise<POSResponse> {
    return this.circuitBreaker.call(() => this.patch(`/products/${id}`, data));
  }

  async updateInventory(productId: number, data: any): Promise<POSResponse> {
    return this.circuitBreaker.call(() => this.patch(`/inventory/${productId}`, data));
  }

  async createProduct(data: any): Promise<POSResponse<POSProduct>> {
    return this.circuitBreaker.call(() => this.post('/products', data));
  }

  async createSale(data: any): Promise<POSResponse<any>> {
    return this.circuitBreaker.call(() => this.post('/sales', data));
  }

  async adjustInventory(data: { product_id: number; quantity: number; change_type: string; note?: string }): Promise<POSResponse<any>> {
    return this.circuitBreaker.call(() => this.post('/inventory/adjust', data));
  }

  async createPosProduct(data: any): Promise<POSResponse<POSProduct>> {
    return this.circuitBreaker.call(() => this.post('/products', data));
  }

  async updatePosProduct(id: number, data: any): Promise<POSResponse> {
    return this.circuitBreaker.call(() => this.put(`/products/${id}`, data));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = this.baseURL.endsWith('/api')
        ? `${this.baseURL}/health`
        : `${this.baseURL}/api/health`;
      const response = await axios.get(url, { timeout: 5000 });
      this.healthStatus = { status: 'connected', timestamp: new Date().toISOString() };
      return true;
    } catch (err: any) {
      this.healthStatus = { status: 'disconnected', error: err.message };
      logger.warn(`POS health check failed: ${err.message}`);
      return false;
    }
  }

  async getHealthStatus(): Promise<any> {
    return this.healthStatus;
  }

  private async get<T>(path: string): Promise<POSResponse<T>> {
    try {
      const response = await axios.get(`${this.baseURL}${path}`, {
        headers: this.getHeaders(),
        timeout: 10000,
      });
      return { success: true, data: response.data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private async post<T>(path: string, data: any): Promise<POSResponse<T>> {
    try {
      const response = await axios.post(`${this.baseURL}${path}`, data, {
        headers: this.getHeaders(),
        timeout: 10000,
      });
      return { success: true, data: response.data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private async patch<T>(path: string, data: any): Promise<POSResponse<T>> {
    try {
      const response = await axios.patch(`${this.baseURL}${path}`, data, {
        headers: this.getHeaders(),
        timeout: 10000,
      });
      return { success: true, data: response.data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private async put<T>(path: string, data: any): Promise<POSResponse<T>> {
    try {
      const response = await axios.put(`${this.baseURL}${path}`, data, {
        headers: this.getHeaders(),
        timeout: 10000,
      });
      return { success: true, data: response.data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

export const posAdapter = new POSAdapter();
export default posAdapter;
