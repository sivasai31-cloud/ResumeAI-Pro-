const BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private getHeaders(isFormData = false): HeadersInit {
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('parentcare_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or unauthorized
        localStorage.removeItem('parentcare_token');
        localStorage.removeItem('parentcare_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      const errorMsg = data?.detail || (typeof data === 'string' ? data : 'An error occurred');
      throw new Error(errorMsg);
    }

    return data as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    return this.handleResponse<T>(response);
  }

  getDownloadUrl(fileId: number): string {
    return `${BASE_URL}/reports/${fileId}/download`;
  }
}

export const api = new ApiClient();
