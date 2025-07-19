from django.contrib import admin
from .models import BOM, BOMComponent, BOMValidation, BOMChangeHistory

@admin.register(BOM)
class BOMAdmin(admin.ModelAdmin):
    pass
    list_display = ['bom_code', 'name', 'parent_item', 'version', 'status']
    list_filter = ['status', 'is_default']
    search_fields = ['bom_code', 'name']

@admin.register(BOMComponent)
class BOMComponentAdmin(admin.ModelAdmin):
    list_display = ['bom', 'item', 'quantity', 'component_type', 'sequence']
    list_filter = ['component_type', 'is_optional']

@admin.register(BOMValidation)
class BOMValidationAdmin(admin.ModelAdmin):
    list_display = ['bom', 'validation_type', 'result', 'validated_at']
    list_filter = ['validation_type', 'result']

@admin.register(BOMChangeHistory)
class BOMChangeHistoryAdmin(admin.ModelAdmin):
    list_display = ['bom', 'change_type', 'changed_by', 'changed_at']
    list_filter = ['change_type']
