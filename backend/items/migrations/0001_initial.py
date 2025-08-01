# Generated by Django 5.0.3 on 2025-07-17 08:28

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='카테고리명')),
                ('description', models.TextField(blank=True, verbose_name='설명')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='생성일시')),
            ],
            options={
                'verbose_name': '카테고리',
                'verbose_name_plural': '카테고리',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Supplier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='업체명')),
                ('contact_person', models.CharField(blank=True, max_length=50, verbose_name='담당자')),
                ('phone', models.CharField(blank=True, max_length=20, verbose_name='전화번호')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='이메일')),
                ('address', models.TextField(blank=True, verbose_name='주소')),
                ('is_active', models.BooleanField(default=True, verbose_name='활성 상태')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='생성일시')),
            ],
            options={
                'verbose_name': '공급업체',
                'verbose_name_plural': '공급업체',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Item',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_code', models.CharField(max_length=50, unique=True, verbose_name='아이템 코드')),
                ('name', models.CharField(max_length=200, verbose_name='아이템명')),
                ('description', models.TextField(blank=True, verbose_name='설명')),
                ('specification', models.TextField(blank=True, verbose_name='규격')),
                ('unit', models.CharField(choices=[('ea', '개'), ('kg', '킬로그램'), ('g', '그램'), ('m', '미터'), ('cm', '센티미터'), ('mm', '밀리미터'), ('l', '리터'), ('ml', '밀리리터')], default='ea', max_length=10, verbose_name='단위')),
                ('weight', models.DecimalField(blank=True, decimal_places=3, max_digits=10, null=True, verbose_name='중량')),
                ('dimensions', models.CharField(blank=True, max_length=100, verbose_name='치수')),
                ('status', models.CharField(choices=[('active', '활성'), ('inactive', '비활성'), ('discontinued', '단종')], default='active', max_length=20, verbose_name='상태')),
                ('minimum_stock', models.PositiveIntegerField(default=0, verbose_name='최소 재고')),
                ('current_stock', models.PositiveIntegerField(default=0, verbose_name='현재 재고')),
                ('standard_cost', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name='표준 단가')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='생성일시')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='수정일시')),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='items.category', verbose_name='카테고리')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_items', to=settings.AUTH_USER_MODEL, verbose_name='생성자')),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='updated_items', to=settings.AUTH_USER_MODEL, verbose_name='수정자')),
            ],
            options={
                'verbose_name': '아이템',
                'verbose_name_plural': '아이템',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ItemSupplier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('supplier_item_code', models.CharField(blank=True, max_length=50, verbose_name='공급업체 아이템 코드')),
                ('unit_price', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name='단가')),
                ('minimum_order_qty', models.PositiveIntegerField(default=1, verbose_name='최소 주문 수량')),
                ('lead_time_days', models.PositiveIntegerField(default=0, verbose_name='리드타임(일)')),
                ('is_primary', models.BooleanField(default=False, verbose_name='주 공급업체')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='생성일시')),
                ('item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='items.item', verbose_name='아이템')),
                ('supplier', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='items.supplier', verbose_name='공급업체')),
            ],
            options={
                'verbose_name': '아이템-공급업체',
                'verbose_name_plural': '아이템-공급업체',
                'unique_together': {('item', 'supplier')},
            },
        ),
    ]
