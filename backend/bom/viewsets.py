from django.db import models, connections
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import BOM, BOMComponent, BOMValidation, BOMChangeHistory
from .serializers import BOMSerializer, BOMComponentSerializer, BOMValidationSerializer, BOMChangeHistorySerializer

class BOMViewSet(viewsets.ModelViewSet):
    queryset = BOM.objects.all()
    serializer_class = BOMSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['bom_code', 'name', 'description']
    filterset_fields = ['status', 'is_default', 'parent_item']
    ordering_fields = ['bom_code', 'name', 'created_at']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def with_external_data(self, request, pk=None):
        """BOM 데이터와 외부 DB 정보를 조인하여 반환"""
        bom = self.get_object()
        serializer = self.get_serializer(bom)
        bom_data = serializer.data
        
        # 외부 DB에서 추가 정보 조회 (더미 데이터로 구현)
        external_data = self._get_external_data_for_bom(bom)
        bom_data['external_data'] = external_data
        
        return Response(bom_data)
    
    def _get_external_data_for_bom(self, bom):
        """
        BOM 구성품들에 대한 외부 DB 정보를 조회
        실제 외부 DB 연결 시 이 메서드를 수정하여 사용
        """
        try:
            # 현재는 더미 데이터를 반환 (외부 DB 연결 정보가 설정되지 않았으므로)
            external_data = {}
            
            for component in bom.components.all():
                item_code = component.item.item_code
                # 더미 외부 데이터 (추후 실제 외부 DB 쿼리로 대체)
                external_data[item_code] = {
                    'supplier_name': f'공급업체-{item_code}',
                    'supplier_code': f'SUP-{item_code[:3]}',
                    'lead_time_days': 7,
                    'current_stock': 100.0,
                    'available_stock': 80.0,
                    'last_purchase_price': 10000.0,
                    'quality_grade': 'A',
                    'note': '외부 DB 연결 후 실제 데이터로 업데이트 예정'
                }
            
            return external_data
            
        except Exception as e:
            # 외부 DB 연결 실패 시 빈 데이터 반환
            return {'error': f'외부 DB 연결 오류: {str(e)}'}
    
    def _query_external_db(self, query, params=None):
        """
        외부 DB 쿼리 실행 (추후 실제 구현)
        현재는 더미 함수
        """
        try:
            # 추후 실제 외부 DB 연결 시 활성화
            # connection = connections['external_db']
            # with connection.cursor() as cursor:
            #     cursor.execute(query, params or [])
            #     return cursor.fetchall()
            
            # 현재는 더미 데이터 반환
            return []
        except Exception as e:
            print(f"외부 DB 쿼리 오류: {e}")
            return []
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """BOM 승인"""
        bom = self.get_object()
        if bom.status == 'pending':
            bom.status = 'approved'
            bom.approved_by = request.user
            from django.utils import timezone
            bom.approved_at = timezone.now()
            bom.save()
            return Response({'status': 'approved'})
        return Response({'error': '승인할 수 없는 상태입니다.'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """BOM 활성화"""
        bom = self.get_object()
        if bom.status == 'approved':
            bom.status = 'active'
            bom.save()
            return Response({'status': 'activated'})
        return Response({'error': '활성화할 수 없는 상태입니다.'}, status=status.HTTP_400_BAD_REQUEST)

class BOMComponentViewSet(viewsets.ModelViewSet):
    queryset = BOMComponent.objects.all()
    serializer_class = BOMComponentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['item__name', 'item__item_code', 'reference_designator']
    filterset_fields = ['component_type', 'is_optional', 'is_phantom', 'bom']
    ordering = ['bom', 'sequence']

class BOMValidationViewSet(viewsets.ModelViewSet):
    queryset = BOMValidation.objects.all()
    serializer_class = BOMValidationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['message']
    filterset_fields = ['validation_type', 'result', 'bom']
    ordering = ['-validated_at']
    
    def perform_create(self, serializer):
        serializer.save(validated_by=self.request.user)

class BOMChangeHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BOMChangeHistory.objects.all()
    serializer_class = BOMChangeHistorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['change_reason']
    filterset_fields = ['change_type', 'bom']
    ordering = ['-changed_at'] 