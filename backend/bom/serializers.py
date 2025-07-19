from rest_framework import serializers
from .models import BOM, BOMComponent, BOMValidation, BOMChangeHistory
from items.serializers import ItemSerializer

class BOMSerializer(serializers.ModelSerializer):
    parent_item_name = serializers.CharField(source='parent_item.name', read_only=True)
    parent_item_code = serializers.CharField(source='parent_item.item_code', read_only=True)
    total_components = serializers.ReadOnlyField()
    total_cost = serializers.ReadOnlyField()
    
    class Meta:
        model = BOM
        fields = '__all__'
        read_only_fields = ('created_by', 'updated_by', 'created_at', 'updated_at', 
                          'approved_by', 'approved_at')

class BOMComponentSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_code = serializers.CharField(source='item.item_code', read_only=True)
    extended_cost = serializers.ReadOnlyField()
    
    class Meta:
        model = BOMComponent
        fields = '__all__'

class BOMValidationSerializer(serializers.ModelSerializer):
    bom_name = serializers.CharField(source='bom.name', read_only=True)
    
    class Meta:
        model = BOMValidation
        fields = '__all__'
        read_only_fields = ('validated_by', 'validated_at')

class BOMChangeHistorySerializer(serializers.ModelSerializer):
    bom_name = serializers.CharField(source='bom.name', read_only=True)
    changed_by_username = serializers.CharField(source='changed_by.username', read_only=True)
    
    class Meta:
        model = BOMChangeHistory
        fields = '__all__'
        read_only_fields = ('changed_by', 'changed_at') 