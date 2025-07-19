const API_BASE_URL = '/api'  // Vite 프록시 사용

export interface Category {
  id: number
  name: string
  description: string
  created_at: string
}

export interface Item {
  id: number
  item_code: string
  name: string
  description: string
  category: number
  category_name?: string
  specification: string
  unit: string
  weight?: number
  dimensions: string
  status: 'active' | 'inactive' | 'discontinued'
  minimum_stock: number
  current_stock: number
  standard_cost?: number
  is_low_stock?: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: number
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  is_active: boolean
  created_at: string
}

export interface BOM {
  id: number
  bom_code: string
  name: string
  description: string
  parent_item: number
  parent_item_name?: string
  parent_item_code?: string
  version: string
  revision_date?: string
  status: 'draft' | 'pending' | 'approved' | 'active' | 'inactive'
  is_default: boolean
  production_quantity: number
  unit_of_measure: string
  total_components?: number
  total_cost?: number
  created_at: string
  updated_at: string
}

export interface BOMComponent {
  id: number
  bom: number
  item: number
  item_name?: string
  item_code?: string
  component_type: 'material' | 'component' | 'subassembly' | 'tool' | 'consumable'
  sequence: number
  quantity: number
  unit_of_measure: string
  reference_designator: string
  notes: string
  is_optional: boolean
  is_phantom: boolean
  extended_cost?: number
}

export interface ExternalItemData {
  supplier_name: string
  supplier_code: string
  lead_time_days: number
  current_stock: number
  available_stock: number
  last_purchase_price: number
  quality_grade: string
  note?: string
}

export interface BOMWithExternalData extends BOM {
  external_data: { [item_code: string]: ExternalItemData }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await this.request<{ results: Category[] }>('/categories/')
    return response.results
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    return this.request<Category>('/categories/', {
      method: 'POST',
      body: JSON.stringify(category),
    })
  }

  // Items
  async getItems(): Promise<Item[]> {
    const response = await this.request<{ results: Item[] }>('/items/')
    return response.results
  }

  async createItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'is_low_stock'>): Promise<Item> {
    return this.request<Item>('/items/', {
      method: 'POST',
      body: JSON.stringify(item),
    })
  }

  async updateItem(id: number, item: Partial<Item>): Promise<Item> {
    return this.request<Item>(`/items/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(item),
    })
  }

  async deleteItem(id: number): Promise<void> {
    await this.request(`/items/${id}/`, {
      method: 'DELETE',
    })
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const response = await this.request<{ results: Supplier[] }>('/suppliers/')
    return response.results
  }

  async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
    return this.request<Supplier>('/suppliers/', {
      method: 'POST',
      body: JSON.stringify(supplier),
    })
  }

  // BOMs
  async getBOMs(): Promise<BOM[]> {
    const response = await this.request<{ results: BOM[] }>('/boms/')
    return response.results
  }

  async createBOM(bom: Omit<BOM, 'id' | 'created_at' | 'updated_at' | 'total_components' | 'total_cost'>): Promise<BOM> {
    return this.request<BOM>('/boms/', {
      method: 'POST',
      body: JSON.stringify(bom),
    })
  }

  async updateBOM(id: number, bom: Partial<BOM>): Promise<BOM> {
    return this.request<BOM>(`/boms/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(bom),
    })
  }

  async approveBOM(id: number): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/boms/${id}/approve/`, {
      method: 'POST',
    })
  }

  async activateBOM(id: number): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/boms/${id}/activate/`, {
      method: 'POST',
    })
  }

  // BOM with External Data
  async getBOMWithExternalData(id: number): Promise<BOMWithExternalData> {
    return this.request<BOMWithExternalData>(`/boms/${id}/with_external_data/`)
  }

  // BOM Components
  async getBOMComponents(bomId?: number): Promise<BOMComponent[]> {
    const endpoint = bomId ? `/bom-components/?bom=${bomId}` : '/bom-components/'
    const response = await this.request<{ results: BOMComponent[] }>(endpoint)
    return response.results
  }

  async createBOMComponent(component: Omit<BOMComponent, 'id' | 'extended_cost'>): Promise<BOMComponent> {
    return this.request<BOMComponent>('/bom-components/', {
      method: 'POST',
      body: JSON.stringify(component),
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL) 