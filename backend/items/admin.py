from django.contrib import admin
from .models import Category, Item, Supplier, ItemSupplier

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['item_code', 'name', 'category', 'status', 'current_stock', 'minimum_stock']
    list_filter = ['status', 'category', 'unit']
    search_fields = ['item_code', 'name']

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'phone', 'email', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']

@admin.register(ItemSupplier)
class ItemSupplierAdmin(admin.ModelAdmin):
    list_display = ['item', 'supplier', 'unit_price', 'is_primary']
    list_filter = ['is_primary']
