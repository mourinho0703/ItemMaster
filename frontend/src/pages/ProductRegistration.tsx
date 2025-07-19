import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';

interface ProductFormData {
  // 제품사양
  salesChannel: string;
  itemGroup: string;
  category: string;
  subCategory: string;
  assemblyType: string;
  separateColumn: string;
  color: string;
  baseThickness: string;
  plywoodThickness: string;
  weight: string;

  // 전산정보
  productName: string;
  productCode: string;
  specification: string;
  majorCategory: string;
  middleCategory: string;
  minorCategory: string;
  assetCategory: string;
  managementDept: string;

  // 유통정보
  domesticForeign: string;
  launchDate: string;
  supplier: string;
  warehouse: string;
}

export const ProductRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProductFormData>({
    // 제품사양
    salesChannel: '',
    itemGroup: '',
    category: '',
    subCategory: '',
    assemblyType: '',
    separateColumn: '',
    color: '',
    baseThickness: '',
    plywoodThickness: '',
    weight: '',

    // 전산정보
    productName: '',
    productCode: '',
    specification: '',
    majorCategory: '',
    middleCategory: '',
    minorCategory: '',
    assetCategory: '',
    managementDept: '',

    // 유통정보
    domesticForeign: '',
    launchDate: '',
    supplier: '',
    warehouse: '',
  });

  // 품명 자동 생성
  useEffect(() => {
    const generateProductName = () => {
      const parts: string[] = [];
      
      // 기본 필수 항목들
      if (formData.salesChannel) {
        // 선택된 값의 텍스트를 가져오기 위한 매핑
        const salesChannelMap: { [key: string]: string } = {
          'online': '온라인',
          'coupang': '쿠팡',
          'coupang_dongmyeong': '쿠팡(동명)',
          'coupang_rocket': '쿠팡(로켓설치)',
          'homeshopping': '홈쇼핑',
          'samsung': '삼성전자',
          'costco': '코스트코',
          'emart': '이마트'
        };
        parts.push(salesChannelMap[formData.salesChannel] || formData.salesChannel);
      }
      
      if (formData.itemGroup) {
        const itemGroupMap: { [key: string]: string } = {
          'speedrack': '스피드랙',
          'hhouse': 'H하우스',
          'light_rack': '경량랙',
          'heavy_rack': '중량랙',
          'space_play': '공간플레이'
        };
        parts.push(itemGroupMap[formData.itemGroup] || formData.itemGroup);
      }
      
      if (formData.category) {
        const categoryMap: { [key: string]: string } = {
          'shelf': '선반',
          'hanger': '행거',
          'desk': '책상',
          'parts': '부품',
          'plywood': '합판'
        };
        parts.push(categoryMap[formData.category] || formData.category);
      }
      
      // 선택적 항목들 (공란일 경우 생략)
      if (formData.subCategory) {
        parts.push(formData.subCategory);
      }
      
      if (formData.assemblyType) {
        const assemblyTypeMap: { [key: string]: string } = {
          'connect': '연결형',
          'bottom_open': '하단오픈형'
        };
        parts.push(assemblyTypeMap[formData.assemblyType] || formData.assemblyType);
      }
      
      if (formData.separateColumn) {
        const separateColumnMap: { [key: string]: string } = {
          'round_column': '원기둥',
          'separate_column': '분리기둥'
        };
        parts.push(separateColumnMap[formData.separateColumn] || formData.separateColumn);
      }
      
      // 사양 생성 (색상, 받침두께, 합판두께 조합)
      const specs: string[] = [];
      if (formData.color) specs.push(formData.color);
      if (formData.baseThickness) specs.push(formData.baseThickness);
      if (formData.plywoodThickness) specs.push(formData.plywoodThickness);
      
      if (specs.length > 0) {
        parts.push(specs.join(''));
      }
      
      return parts.join('/');
    };

    const newProductName = generateProductName();
    setFormData(prev => ({
      ...prev,
      productName: newProductName
    }));
  }, [
    formData.salesChannel,
    formData.itemGroup,
    formData.category,
    formData.subCategory,
    formData.assemblyType,
    formData.separateColumn,
    formData.color,
    formData.baseThickness,
    formData.plywoodThickness
  ]);

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    console.log('완제품 등록 데이터:', formData);
    
    // 완제품 등록 데이터를 localStorage에 저장
    localStorage.setItem('productRegistrationData', JSON.stringify({
      productName: formData.productName,
      productCode: formData.productCode,
      specification: formData.specification,
      // 기타 필요한 데이터들
      salesChannel: formData.salesChannel,
      itemGroup: formData.itemGroup,
      category: formData.category,
      color: formData.color,
      baseThickness: formData.baseThickness,
      plywoodThickness: formData.plywoodThickness
    }));
    
    // TODO: API 호출로 데이터 저장
    // 규격 선택 페이지로 이동
    navigate('/items/specification');
  };

  const handleGoBack = () => {
    navigate('/items');
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>돌아가기</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">완제품 등록</h1>
            <p className="text-gray-600 mt-2">포장된 선반, 행거 등의 완제품 정보를 등록합니다.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-blue-600">
          <Package className="w-8 h-8" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 제품사양 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-600">제품사양</CardTitle>
            <CardDescription>제품의 기본 사양 정보를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salesChannel">판매채널</Label>
              <Select value={formData.salesChannel} onValueChange={(value) => handleInputChange('salesChannel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="판매채널 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">온라인</SelectItem>
                  <SelectItem value="coupang">쿠팡</SelectItem>
                  <SelectItem value="coupang_dongmyeong">쿠팡(동명)</SelectItem>
                  <SelectItem value="coupang_rocket">쿠팡(로켓설치)</SelectItem>
                  <SelectItem value="homeshopping">홈쇼핑</SelectItem>
                  <SelectItem value="samsung">삼성전자</SelectItem>
                  <SelectItem value="costco">코스트코</SelectItem>
                  <SelectItem value="emart">이마트</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemGroup">품목군</Label>
              <Select value={formData.itemGroup} onValueChange={(value) => handleInputChange('itemGroup', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="품목군 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="speedrack">스피드랙</SelectItem>
                  <SelectItem value="hhouse">H하우스</SelectItem>
                  <SelectItem value="light_rack">경량랙</SelectItem>
                  <SelectItem value="heavy_rack">중량랙</SelectItem>
                  <SelectItem value="space_play">공간플레이</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shelf">선반</SelectItem>
                  <SelectItem value="hanger">행거</SelectItem>
                  <SelectItem value="desk">책상</SelectItem>
                  <SelectItem value="parts">부품</SelectItem>
                  <SelectItem value="plywood">합판</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subCategory">세부카테고리</Label>
              <Input
                id="subCategory"
                value={formData.subCategory}
                onChange={(e) => handleInputChange('subCategory', e.target.value)}
                placeholder="세부카테고리 입력"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assemblyType">조립형태</Label>
              <Select value={formData.assemblyType} onValueChange={(value) => handleInputChange('assemblyType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="조립형태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connect">연결형</SelectItem>
                  <SelectItem value="bottom_open">하단오픈형</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="separateColumn">분리기둥여부</Label>
              <Select value={formData.separateColumn} onValueChange={(value) => handleInputChange('separateColumn', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="분리기둥여부 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_column">원기둥</SelectItem>
                  <SelectItem value="separate_column">분리기둥</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">색상</Label>
              <Select value={formData.color} onValueChange={(value) => handleInputChange('color', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="색상 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="W">W</SelectItem>
                  <SelectItem value="N">N</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseThickness">받침두께</Label>
              <Select value={formData.baseThickness} onValueChange={(value) => handleInputChange('baseThickness', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="받침두께 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="160">160</SelectItem>
                  <SelectItem value="120">120</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plywoodThickness">합판두께</Label>
              <Select value={formData.plywoodThickness} onValueChange={(value) => handleInputChange('plywoodThickness', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="합판두께 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B9">B9</SelectItem>
                  <SelectItem value="B6">B6</SelectItem>
                  <SelectItem value="B12">B12</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">중량 (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                placeholder="중량 입력"
              />
            </div>
          </CardContent>
        </Card>

        {/* 전산정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-600">전산정보</CardTitle>
            <CardDescription>시스템 관리를 위한 전산 정보를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">품명 (자동생성)</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                placeholder="드롭다운 선택시 자동 생성됩니다"
                readOnly
                className="bg-gray-50 text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productCode">품번</Label>
              <Input
                id="productCode"
                value={formData.productCode}
                onChange={(e) => handleInputChange('productCode', e.target.value)}
                placeholder="품번 입력"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specification">규격</Label>
              <Textarea
                id="specification"
                value={formData.specification}
                onChange={(e) => handleInputChange('specification', e.target.value)}
                placeholder="규격 입력"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="majorCategory">대분류</Label>
              <Select value={formData.majorCategory} onValueChange={(value) => handleInputChange('majorCategory', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="대분류 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="furniture">가구</SelectItem>
                  <SelectItem value="storage">수납용품</SelectItem>
                  <SelectItem value="display">진열용품</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleCategory">중분류</Label>
              <Input
                id="middleCategory"
                value={formData.middleCategory}
                onChange={(e) => handleInputChange('middleCategory', e.target.value)}
                placeholder="중분류 입력"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minorCategory">소분류</Label>
              <Input
                id="minorCategory"
                value={formData.minorCategory}
                onChange={(e) => handleInputChange('minorCategory', e.target.value)}
                placeholder="소분류 입력"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetCategory">자산분류</Label>
              <Select value={formData.assetCategory} onValueChange={(value) => handleInputChange('assetCategory', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="자산분류 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">재고자산</SelectItem>
                  <SelectItem value="fixed">고정자산</SelectItem>
                  <SelectItem value="consumable">소모품</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="managementDept">관리부서</Label>
              <Select value={formData.managementDept} onValueChange={(value) => handleInputChange('managementDept', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="관리부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_part">영업파트</SelectItem>
                  <SelectItem value="commerce_part">커머스파트</SelectItem>
                  <SelectItem value="commerce_sales_team">커머스영업팀</SelectItem>
                  <SelectItem value="logistics_support_part">물류지원파트</SelectItem>
                  <SelectItem value="production_support_team">생산지원팀</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 유통정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-orange-600">유통정보</CardTitle>
            <CardDescription>제품 유통 관련 정보를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domesticForeign">내외자</Label>
              <Select value={formData.domesticForeign} onValueChange={(value) => handleInputChange('domesticForeign', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="내외자 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">내자(국내제품)</SelectItem>
                  <SelectItem value="foreign">외자(해외제품)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="launchDate">출시일자</Label>
              <Input
                id="launchDate"
                type="date"
                value={formData.launchDate}
                onChange={(e) => handleInputChange('launchDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">거래처</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                placeholder="거래처 입력"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">관리창고</Label>
              <Select value={formData.warehouse} onValueChange={(value) => handleInputChange('warehouse', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="관리창고 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">본창고</SelectItem>
                  <SelectItem value="sub1">제1창고</SelectItem>
                  <SelectItem value="sub2">제2창고</SelectItem>
                  <SelectItem value="finished">완제품창고</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={handleGoBack}>
          취소
        </Button>
        <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
          <ChevronRight className="w-4 h-4 mr-2" />
          규격 등록
        </Button>
      </div>
    </div>
  );
}; 