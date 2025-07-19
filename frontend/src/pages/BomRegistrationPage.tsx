import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface ProductData {
  productName: string;
  productCode: string;
  specification: string;
  salesChannel: string;
  itemGroup: string;
  category: string;
  color: string;
  baseThickness: string;
  plywoodThickness: string;
}

interface SpecificationData {
  id: string;
  width: string;
  depth: string;
  height: string;
  tier: string;
}

interface BOMTableRow {
  id: string;
  productName: string;
  productCode: string;
  specification: string;
  subMaterialName: string;
  subMaterialCode: string;
  subMaterialSpec: string;
  quantity: number;
}

export const BomRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [bomTableData, setBomTableData] = useState<BOMTableRow[]>([]);

  useEffect(() => {
    // localStorage에서 데이터 읽기
    const productDataStr = localStorage.getItem('productRegistrationData');
    const specificationDataStr = localStorage.getItem('specificationData');

    if (productDataStr && specificationDataStr) {
      const productData: ProductData = JSON.parse(productDataStr);
      const specificationData: SpecificationData[] = JSON.parse(specificationDataStr);

      // 데이터 조인하여 BOM 테이블 데이터 생성
      const bomData: BOMTableRow[] = [];

      specificationData.forEach((spec, index) => {
        const specString = `${spec.width}×${spec.depth}×${spec.height}×${spec.tier}`;
        
        bomData.push({
          id: `${index + 1}`,
          productName: productData.productName,
          productCode: productData.productCode,
          specification: specString,
          subMaterialName: '', // 추후 입력될 예정
          subMaterialCode: '', // 추후 입력될 예정
          subMaterialSpec: '', // 추후 입력될 예정
          quantity: 0 // 추후 입력될 예정
        });
      });

      setBomTableData(bomData);
    }
  }, []);

  const handleGoBack = () => {
    navigate('/items/specification');
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
            <h1 className="text-3xl font-bold text-gray-900">BOM 등록</h1>
            <p className="text-gray-600 mt-2">완제품의 BOM을 등록합니다.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽 컨테이너 */}
        <div className="space-y-6">
          {/* 왼쪽 위 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-600">공통 하위BOM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center min-h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-600 mb-2">공통 하위BOM 영역</h3>
                  <p className="text-gray-500">컨텐츠가 들어갈 영역입니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 왼쪽 아래 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-600">품목별 추가BOM</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center min-h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-600 mb-2">품목별 추가BOM 영역</h3>
                  <p className="text-gray-500">컨텐츠가 들어갈 영역입니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽 컨테이너 - BOM 데이터베이스 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-orange-600">BOM 데이터베이스</CardTitle>
            <CardDescription>완제품과 규격이 조인된 BOM 데이터입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {bomTableData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>등록된 데이터가 없습니다.</p>
                <p className="text-sm mt-2">완제품 등록과 규격 선택을 완료해주세요.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-900 text-sm">품명</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-900 text-sm">품번</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-900 text-sm">규격</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-900 text-sm">하위자재명</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-900 text-sm">하위자재번호</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-900 text-sm">하위자재규격</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-900 text-sm">소요량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomTableData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 text-sm">{row.productName}</td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">{row.productCode}</td>
                        <td className="border border-gray-200 px-3 py-2 text-sm">{row.specification}</td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-gray-400">
                          {row.subMaterialName || '미입력'}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-gray-400">
                          {row.subMaterialCode || '미입력'}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-gray-400">
                          {row.subMaterialSpec || '미입력'}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-sm text-gray-400">
                          {row.quantity || '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 