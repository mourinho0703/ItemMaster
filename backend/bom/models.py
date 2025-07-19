from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from items.models import Item

class BOM(models.Model):
    """BOM(자재 명세서) 헤더"""
    STATUS_CHOICES = [
        ('draft', '임시저장'),
        ('pending', '검토대기'),
        ('approved', '승인'),
        ('active', '활성'),
        ('inactive', '비활성'),
    ]
    
    # 기본 정보
    bom_code = models.CharField(max_length=50, unique=True, verbose_name="BOM 코드")
    name = models.CharField(max_length=200, verbose_name="BOM명")
    description = models.TextField(blank=True, verbose_name="설명")
    parent_item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='boms', verbose_name="완성품")
    
    # 버전 관리
    version = models.CharField(max_length=20, default='1.0', verbose_name="버전")
    revision_date = models.DateField(null=True, blank=True, verbose_name="개정일")
    
    # 상태 정보
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="상태")
    is_default = models.BooleanField(default=False, verbose_name="기본 BOM")
    
    # 생산 정보
    production_quantity = models.DecimalField(max_digits=10, decimal_places=3, default=1, 
                                            validators=[MinValueValidator(0.001)], 
                                            verbose_name="생산 수량")
    unit_of_measure = models.CharField(max_length=10, default='ea', verbose_name="단위")
    
    # 시간 정보
    setup_time_minutes = models.PositiveIntegerField(default=0, verbose_name="준비시간(분)")
    production_time_minutes = models.PositiveIntegerField(default=0, verbose_name="생산시간(분)")
    
    # 시스템 정보
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_boms', verbose_name="생성자")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_boms', verbose_name="수정자")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")
    
    # 승인 정보
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                  related_name='approved_boms', verbose_name="승인자")
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name="승인일시")
    
    class Meta:
        verbose_name = "BOM"
        verbose_name_plural = "BOM"
        ordering = ['-created_at']
        unique_together = ['parent_item', 'version']
    
    def __str__(self):
        return f"{self.bom_code} - {self.name} (v{self.version})"
    
    @property
    def total_components(self):
        """총 구성품 수"""
        return self.components.count()
    
    @property
    def total_cost(self):
        """총 비용"""
        total = 0
        for component in self.components.all():
            if component.item.standard_cost:
                total += component.item.standard_cost * component.quantity
        return total


class BOMComponent(models.Model):
    """BOM 구성품"""
    COMPONENT_TYPE_CHOICES = [
        ('material', '원자재'),
        ('component', '부품'),
        ('subassembly', '반제품'),
        ('tool', '공구'),
        ('consumable', '소모품'),
    ]
    
    # 관계 정보
    bom = models.ForeignKey(BOM, on_delete=models.CASCADE, related_name='components', verbose_name="BOM")
    item = models.ForeignKey(Item, on_delete=models.CASCADE, verbose_name="구성 아이템")
    
    # 구성품 정보
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPE_CHOICES, 
                                    default='material', verbose_name="구성품 유형")
    sequence = models.PositiveIntegerField(default=1, verbose_name="순서")
    quantity = models.DecimalField(max_digits=10, decimal_places=3, 
                                 validators=[MinValueValidator(0.001)], 
                                 verbose_name="소요량")
    unit_of_measure = models.CharField(max_length=10, verbose_name="단위")
    
    # 추가 정보
    reference_designator = models.CharField(max_length=50, blank=True, verbose_name="참조 지시자")
    notes = models.TextField(blank=True, verbose_name="비고")
    is_optional = models.BooleanField(default=False, verbose_name="선택사항")
    is_phantom = models.BooleanField(default=False, verbose_name="팬텀 부품")
    
    # 대체품 정보
    substitute_items = models.ManyToManyField(Item, blank=True, related_name='substitute_for', 
                                            verbose_name="대체 아이템")
    
    # 유효성 정보
    effective_date = models.DateField(null=True, blank=True, verbose_name="유효 시작일")
    expiry_date = models.DateField(null=True, blank=True, verbose_name="유효 종료일")
    
    # 시스템 정보
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")
    
    class Meta:
        verbose_name = "BOM 구성품"
        verbose_name_plural = "BOM 구성품"
        ordering = ['sequence', 'item__name']
        unique_together = ['bom', 'item']
    
    def __str__(self):
        return f"{self.bom.name} - {self.item.name} ({self.quantity})"
    
    @property
    def extended_cost(self):
        """확장 비용 (단가 × 수량)"""
        if self.item.standard_cost:
            return self.item.standard_cost * self.quantity
        return 0


class BOMValidation(models.Model):
    """BOM 검증 기록"""
    VALIDATION_TYPE_CHOICES = [
        ('structure', '구조 검증'),
        ('cost', '비용 검증'),
        ('availability', '가용성 검증'),
        ('compliance', '규정 준수 검증'),
    ]
    
    RESULT_CHOICES = [
        ('pass', '통과'),
        ('fail', '실패'),
        ('warning', '경고'),
    ]
    
    bom = models.ForeignKey(BOM, on_delete=models.CASCADE, related_name='validations', verbose_name="BOM")
    validation_type = models.CharField(max_length=20, choices=VALIDATION_TYPE_CHOICES, verbose_name="검증 유형")
    result = models.CharField(max_length=10, choices=RESULT_CHOICES, verbose_name="결과")
    message = models.TextField(verbose_name="메시지")
    details = models.JSONField(blank=True, null=True, verbose_name="상세 정보")
    
    validated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="검증자")
    validated_at = models.DateTimeField(auto_now_add=True, verbose_name="검증일시")
    
    class Meta:
        verbose_name = "BOM 검증"
        verbose_name_plural = "BOM 검증"
        ordering = ['-validated_at']
    
    def __str__(self):
        return f"{self.bom.name} - {self.get_validation_type_display()} ({self.get_result_display()})"


class BOMChangeHistory(models.Model):
    """BOM 변경 이력"""
    CHANGE_TYPE_CHOICES = [
        ('create', '신규 생성'),
        ('update', '수정'),
        ('delete', '삭제'),
        ('approve', '승인'),
        ('activate', '활성화'),
        ('deactivate', '비활성화'),
    ]
    
    bom = models.ForeignKey(BOM, on_delete=models.CASCADE, related_name='change_history', verbose_name="BOM")
    change_type = models.CharField(max_length=20, choices=CHANGE_TYPE_CHOICES, verbose_name="변경 유형")
    old_value = models.JSONField(blank=True, null=True, verbose_name="이전 값")
    new_value = models.JSONField(blank=True, null=True, verbose_name="새 값")
    change_reason = models.TextField(blank=True, verbose_name="변경 사유")
    
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="변경자")
    changed_at = models.DateTimeField(auto_now_add=True, verbose_name="변경일시")
    
    class Meta:
        verbose_name = "BOM 변경 이력"
        verbose_name_plural = "BOM 변경 이력"
        ordering = ['-changed_at']
    
    def __str__(self):
        return f"{self.bom.name} - {self.get_change_type_display()} ({self.changed_at.strftime('%Y-%m-%d %H:%M')})"
