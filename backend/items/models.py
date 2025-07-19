from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Category(models.Model):
    """아이템 카테고리"""
    name = models.CharField(max_length=100, unique=True, verbose_name="카테고리명")
    description = models.TextField(blank=True, verbose_name="설명")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    
    class Meta:
        verbose_name = "카테고리"
        verbose_name_plural = "카테고리"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Item(models.Model):
    """아이템 정보"""
    UNIT_CHOICES = [
        ('ea', '개'),
        ('kg', '킬로그램'),
        ('g', '그램'),
        ('m', '미터'),
        ('cm', '센티미터'),
        ('mm', '밀리미터'),
        ('l', '리터'),
        ('ml', '밀리리터'),
    ]
    
    STATUS_CHOICES = [
        ('active', '활성'),
        ('inactive', '비활성'),
        ('discontinued', '단종'),
    ]
    
    # 기본 정보
    item_code = models.CharField(max_length=50, unique=True, verbose_name="아이템 코드")
    name = models.CharField(max_length=200, verbose_name="아이템명")
    description = models.TextField(blank=True, verbose_name="설명")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="카테고리")
    
    # 규격 정보
    specification = models.TextField(blank=True, verbose_name="규격")
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='ea', verbose_name="단위")
    weight = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True, verbose_name="중량")
    dimensions = models.CharField(max_length=100, blank=True, verbose_name="치수")
    
    # 상태 및 관리 정보
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="상태")
    minimum_stock = models.PositiveIntegerField(default=0, verbose_name="최소 재고")
    current_stock = models.PositiveIntegerField(default=0, verbose_name="현재 재고")
    
    # 비용 정보
    standard_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="표준 단가")
    
    # 시스템 정보
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_items', verbose_name="생성자")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_items', verbose_name="수정자")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")
    
    class Meta:
        verbose_name = "아이템"
        verbose_name_plural = "아이템"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.item_code} - {self.name}"
    
    @property
    def is_low_stock(self):
        """재고 부족 여부"""
        return self.current_stock <= self.minimum_stock


class Supplier(models.Model):
    """공급업체 정보"""
    name = models.CharField(max_length=100, verbose_name="업체명")
    contact_person = models.CharField(max_length=50, blank=True, verbose_name="담당자")
    phone = models.CharField(max_length=20, blank=True, verbose_name="전화번호")
    email = models.EmailField(blank=True, verbose_name="이메일")
    address = models.TextField(blank=True, verbose_name="주소")
    is_active = models.BooleanField(default=True, verbose_name="활성 상태")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    
    class Meta:
        verbose_name = "공급업체"
        verbose_name_plural = "공급업체"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ItemSupplier(models.Model):
    """아이템-공급업체 관계"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, verbose_name="아이템")
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, verbose_name="공급업체")
    supplier_item_code = models.CharField(max_length=50, blank=True, verbose_name="공급업체 아이템 코드")
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="단가")
    minimum_order_qty = models.PositiveIntegerField(default=1, verbose_name="최소 주문 수량")
    lead_time_days = models.PositiveIntegerField(default=0, verbose_name="리드타임(일)")
    is_primary = models.BooleanField(default=False, verbose_name="주 공급업체")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    
    class Meta:
        verbose_name = "아이템-공급업체"
        verbose_name_plural = "아이템-공급업체"
        unique_together = ['item', 'supplier']
    
    def __str__(self):
        return f"{self.item.name} - {self.supplier.name}"
