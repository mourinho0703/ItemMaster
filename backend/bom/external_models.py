from django.db import models

class ExternalItemData(models.Model):
    """
    외부 DB의 아이템 추가 정보 (더미 모델)
    추후 실제 외부 DB 스키마에 맞게 수정 예정
    """
    item_code = models.CharField(max_length=50, primary_key=True, verbose_name="아이템 코드")
    supplier_name = models.CharField(max_length=200, blank=True, verbose_name="공급업체명")
    supplier_code = models.CharField(max_length=50, blank=True, verbose_name="공급업체 코드")
    lead_time_days = models.PositiveIntegerField(default=0, verbose_name="리드타임(일)")
    minimum_order_qty = models.DecimalField(max_digits=10, decimal_places=3, default=1, verbose_name="최소 주문량")
    current_stock = models.DecimalField(max_digits=12, decimal_places=3, default=0, verbose_name="현재 재고")
    reserved_stock = models.DecimalField(max_digits=12, decimal_places=3, default=0, verbose_name="예약 재고")
    available_stock = models.DecimalField(max_digits=12, decimal_places=3, default=0, verbose_name="가용 재고")
    last_purchase_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name="최근 구매가")
    last_purchase_date = models.DateField(null=True, blank=True, verbose_name="최근 구매일")
    quality_grade = models.CharField(max_length=10, blank=True, verbose_name="품질 등급")
    external_updated_at = models.DateTimeField(null=True, blank=True, verbose_name="외부 DB 업데이트 일시")

    class Meta:
        app_label = 'external_data'
        db_table = 'external_item_data'
        verbose_name = "외부 아이템 데이터"
        verbose_name_plural = "외부 아이템 데이터"
        managed = False  # Django가 이 테이블을 관리하지 않음 (외부 DB이므로)

    def __str__(self):
        return f"{self.item_code} - {self.supplier_name}"


class ExternalSupplierData(models.Model):
    """
    외부 DB의 공급업체 정보 (더미 모델)
    추후 실제 외부 DB 스키마에 맞게 수정 예정
    """
    supplier_code = models.CharField(max_length=50, primary_key=True, verbose_name="공급업체 코드")
    supplier_name = models.CharField(max_length=200, verbose_name="공급업체명")
    contact_person = models.CharField(max_length=100, blank=True, verbose_name="담당자")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="전화번호")
    email = models.EmailField(blank=True, verbose_name="이메일")
    address = models.TextField(blank=True, verbose_name="주소")
    credit_rating = models.CharField(max_length=10, blank=True, verbose_name="신용등급")
    is_active = models.BooleanField(default=True, verbose_name="활성 상태")

    class Meta:
        app_label = 'external_data'
        db_table = 'external_supplier_data'
        verbose_name = "외부 공급업체 데이터"
        verbose_name_plural = "외부 공급업체 데이터"
        managed = False  # Django가 이 테이블을 관리하지 않음 (외부 DB이므로)

    def __str__(self):
        return f"{self.supplier_code} - {self.supplier_name}" 