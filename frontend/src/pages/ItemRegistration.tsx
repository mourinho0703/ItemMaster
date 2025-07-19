import React, { useState } from 'react';
import { Package, Factory, Truck, ShoppingCart, Search, Grid3x3, Building, Box, ArrowRightLeft, Layers, Boxes, AlignJustify } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface Item {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  price: number;
  description: string;
}

export const ItemRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([
    {
      id: '1',
      name: '볼트 M8x20',
      code: 'BOLT-M8-20',
      category: '패스너',
      unit: 'EA',
      price: 150,
      description: '스테인리스 볼트'
    },
    {
      id: '2',
      name: '알루미늄 플레이트',
      code: 'AL-PLATE-001',
      category: '소재',
      unit: 'KG',
      price: 8500,
      description: '두께 5mm 알루미늄 플레이트'
    }
  ]);

  const handleProductionItem = () => {
    navigate('/items/product');
  };

  const handleSubcontractItem = () => {
    console.log('외주품 등록 버튼 클릭');
  };

  const handlePurchaseItem = () => {
    console.log('구매품 등록 버튼 클릭');
  };

  const handleConsumableItem = () => {
    console.log('소모품 등록 버튼 클릭');
  };

  const handleSourcingItem = () => {
    console.log('소싱품 등록 버튼 클릭');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">품목 등록</h1>
          <p className="text-gray-600 mt-2">제품 및 부품 정보를 등록하고 관리합니다.</p>
        </div>
        <div className="flex items-center space-x-2 text-blue-600">
          <Package className="w-8 h-8" />
          <span className="text-2xl font-bold">{items.length}</span>
          <span className="text-sm">등록된 품목</span>
        </div>
      </div>

      {/* 품목 유형 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>품목 유형 선택</CardTitle>
          <CardDescription>등록할 품목의 유형을 선택하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-start">
            <div className="grid grid-cols-5 gap-8 w-full max-w-6xl">
              <Button
                onClick={handleProductionItem}
                className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center justify-center p-12"
                style={{ width: '192px', height: '192px', minWidth: '192px', minHeight: '192px' }}
              >
                <Boxes className="w-16 h-16 mb-4" />
                <span className="text-xl font-semibold">완제품</span>
                <span className="text-base opacity-90 mt-2">포장된 선반, 행거</span>
              </Button>
              
              <Button
                onClick={handleSubcontractItem}
                className="rounded-2xl bg-green-600 hover:bg-green-700 text-white flex flex-col items-center justify-center p-12"
                style={{ width: '192px', height: '192px', minWidth: '192px', minHeight: '192px' }}
              >
                <AlignJustify className="w-16 h-16 mb-4" />
                <span className="text-xl font-semibold">프레임</span>
                <span className="text-base opacity-90 mt-2">기둥, 받침, 보강대</span>
              </Button>
              
              <Button
                onClick={handlePurchaseItem}
                className="rounded-2xl bg-orange-600 hover:bg-orange-700 text-white flex flex-col items-center justify-center p-12"
                style={{ width: '192px', height: '192px', minWidth: '192px', minHeight: '192px' }}
              >
                <Box className="w-16 h-16 mb-4" />
                <span className="text-xl font-semibold">부자재</span>
                <span className="text-base opacity-90 mt-2">외부 구매 후 직포장</span>
              </Button>

              <Button
                onClick={handleConsumableItem}
                className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex flex-col items-center justify-center p-12"
                style={{ width: '192px', height: '192px', minWidth: '192px', minHeight: '192px' }}
              >
                <Package className="w-16 h-16 mb-4" />
                <span className="text-xl font-semibold">소모품</span>
                <span className="text-base opacity-90 mt-2">포장재 등의 소모품</span>
              </Button>

              <Button
                onClick={handleSourcingItem}
                className="rounded-2xl bg-teal-600 hover:bg-teal-700 text-white flex flex-col items-center justify-center p-12"
                style={{ width: '192px', height: '192px', minWidth: '192px', minHeight: '192px' }}
              >
                <ArrowRightLeft className="w-16 h-16 mb-4" />
                <span className="text-xl font-semibold">소싱품</span>
                <span className="text-base opacity-90 mt-2">유통만 하는 완제품</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
