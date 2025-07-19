
import React, { useState } from 'react';
import { Plus, FileText, Trash2, Edit, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiClient, type ExternalItemData } from '@/lib/api';

interface BomItem {
  id: string;
  parentCode: string;
  childCode: string;
  quantity: number;
  unit: string;
  level: number;
  externalData?: ExternalItemData;
}

interface Bom {
  id: string;
  productCode: string;
  productName: string;
  version: string;
  items: BomItem[];
}

export const BomRegistration: React.FC = () => {
  const [boms, setBoms] = useState<Bom[]>([
    {
      id: '1',
      productCode: 'PROD-001',
      productName: '기계 부품 어셈블리',
      version: 'v1.0',
      items: [
        { id: '1', parentCode: 'PROD-001', childCode: 'AL-PLATE-001', quantity: 2, unit: 'KG', level: 1 },
        { id: '2', parentCode: 'PROD-001', childCode: 'BOLT-M8-20', quantity: 8, unit: 'EA', level: 1 }
      ]
    }
  ]);

  const [selectedBom, setSelectedBom] = useState<string>('');
  const [externalDataLoading, setExternalDataLoading] = useState<boolean>(false);
  const [showExternalData, setShowExternalData] = useState<boolean>(false);
  const [newBom, setNewBom] = useState({ productCode: '', productName: '', version: '' });
  const [newBomItem, setNewBomItem] = useState({
    parentCode: '',
    childCode: '',
    quantity: 0,
    unit: 'EA',
    level: 1
  });

  const handleCreateBom = () => {
    if (newBom.productCode && newBom.productName) {
      const bom: Bom = {
        id: Date.now().toString(),
        productCode: newBom.productCode,
        productName: newBom.productName,
        version: newBom.version || 'v1.0',
        items: []
      };
      setBoms([...boms, bom]);
      setNewBom({ productCode: '', productName: '', version: '' });
    }
  };

  const handleAddBomItem = () => {
    if (selectedBom && newBomItem.childCode && newBomItem.quantity > 0) {
      const updatedBoms = boms.map(bom => {
        if (bom.id === selectedBom) {
          const item: BomItem = {
            id: Date.now().toString(),
            parentCode: newBomItem.parentCode || bom.productCode,
            childCode: newBomItem.childCode,
            quantity: newBomItem.quantity,
            unit: newBomItem.unit,
            level: newBomItem.level
          };
          return { ...bom, items: [...bom.items, item] };
        }
        return bom;
      });
      setBoms(updatedBoms);
      setNewBomItem({ parentCode: '', childCode: '', quantity: 0, unit: 'EA', level: 1 });
    }
  };

  const handleDeleteBomItem = (bomId: string, itemId: string) => {
    const updatedBoms = boms.map(bom => {
      if (bom.id === bomId) {
        return { ...bom, items: bom.items.filter(item => item.id !== itemId) };
      }
      return bom;
    });
    setBoms(updatedBoms);
  };

  const currentBom = boms.find(bom => bom.id === selectedBom);

  // 외부 DB 데이터 로드 함수
  const loadExternalData = async () => {
    if (!selectedBom) return;
    
    setExternalDataLoading(true);
    try {
      // 실제 API 호출 시 사용할 코드 (현재는 더미 데이터)
      // const bomWithExternalData = await apiClient.getBOMWithExternalData(Number(selectedBom));
      
      // 더미 외부 데이터 생성
      const currentBomData = boms.find(bom => bom.id === selectedBom);
      if (currentBomData) {
        const updatedBoms = boms.map(bom => {
          if (bom.id === selectedBom) {
            const updatedItems = bom.items.map(item => ({
              ...item,
              externalData: {
                supplier_name: `공급업체-${item.childCode}`,
                supplier_code: `SUP-${item.childCode.slice(0, 3)}`,
                lead_time_days: Math.floor(Math.random() * 14) + 1,
                current_stock: Math.floor(Math.random() * 1000) + 100,
                available_stock: Math.floor(Math.random() * 800) + 50,
                last_purchase_price: Math.floor(Math.random() * 50000) + 5000,
                quality_grade: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
                note: '외부 DB 연결 후 실제 데이터로 업데이트 예정'
              }
            }));
            return { ...bom, items: updatedItems };
          }
          return bom;
        });
        setBoms(updatedBoms);
        setShowExternalData(true);
      }
    } catch (error) {
      console.error('외부 DB 데이터 로드 실패:', error);
    } finally {
      setExternalDataLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">BOM 수정</h1>
          <p className="text-gray-600 mt-2">제품의 부품 구성표(BOM)를 수정하고 관리합니다.</p>
        </div>
        <div className="flex items-center space-x-2 text-green-600">
          <FileText className="w-8 h-8" />
          <span className="text-2xl font-bold">{boms.length}</span>
          <span className="text-sm">등록된 BOM</span>
        </div>
      </div>

      {/* 새 BOM 생성 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>새 BOM 생성</span>
          </CardTitle>
          <CardDescription>새로운 제품의 BOM을 생성합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productCode">제품코드</Label>
              <Input
                id="productCode"
                value={newBom.productCode}
                onChange={(e) => setNewBom({ ...newBom, productCode: e.target.value })}
                placeholder="제품코드를 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productName">제품명</Label>
              <Input
                id="productName"
                value={newBom.productName}
                onChange={(e) => setNewBom({ ...newBom, productName: e.target.value })}
                placeholder="제품명을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">버전</Label>
              <Input
                id="version"
                value={newBom.version}
                onChange={(e) => setNewBom({ ...newBom, version: e.target.value })}
                placeholder="v1.0"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleCreateBom} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              BOM 생성
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BOM 선택 및 부품 추가 */}
      <Card>
        <CardHeader>
          <CardTitle>BOM 구성 관리</CardTitle>
          <CardDescription>기존 BOM에 부품을 추가하거나 수정합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bomSelect">BOM 선택</Label>
              <div className="flex space-x-2">
                <Select value={selectedBom} onValueChange={setSelectedBom}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="수정할 BOM을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {boms.map((bom) => (
                      <SelectItem key={bom.id} value={bom.id}>
                        {bom.productCode} - {bom.productName} ({bom.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBom && (
                  <Button 
                    onClick={loadExternalData} 
                    disabled={externalDataLoading}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    {externalDataLoading ? '로딩...' : '외부 DB 조회'}
                  </Button>
                )}
              </div>
            </div>

            {selectedBom && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">부품 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="childCode">부품코드</Label>
                    <Input
                      id="childCode"
                      value={newBomItem.childCode}
                      onChange={(e) => setNewBomItem({ ...newBomItem, childCode: e.target.value })}
                      placeholder="부품코드"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">수량</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newBomItem.quantity}
                      onChange={(e) => setNewBomItem({ ...newBomItem, quantity: Number(e.target.value) })}
                      placeholder="수량"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitSelect">단위</Label>
                    <Select value={newBomItem.unit} onValueChange={(value) => setNewBomItem({ ...newBomItem, unit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EA">EA</SelectItem>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="SET">SET</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">레벨</Label>
                    <Input
                      id="level"
                      type="number"
                      min="1"
                      value={newBomItem.level}
                      onChange={(e) => setNewBomItem({ ...newBomItem, level: Number(e.target.value) })}
                      placeholder="레벨"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddBomItem} className="w-full bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      추가
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* BOM 상세 보기 */}
      {currentBom && (
        <>
          {/* 외부 DB 연결 상태 카드 */}
          {showExternalData && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <Database className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">외부 DB 정보 연동</h3>
                    <p className="text-sm text-blue-700">
                      공급업체, 재고, 가격 정보가 외부 시스템에서 조회되었습니다. 
                      (※ 현재는 더미 데이터입니다. 실제 외부 DB 연결 시 실제 데이터로 표시됩니다.)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>{currentBom.productName} - BOM 구성</CardTitle>
              <CardDescription>제품코드: {currentBom.productCode} | 버전: {currentBom.version}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">레벨</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">상위 코드</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">부품 코드</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">수량</th>
                      <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">단위</th>
                      {showExternalData && (
                        <>
                          <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">공급업체</th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">가용재고</th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">품질등급</th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">단가</th>
                        </>
                      )}
                      <th className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-900">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBom.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            L{item.level}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 font-mono text-sm">{item.parentCode}</td>
                        <td className="border border-gray-200 px-4 py-3 font-mono text-sm font-medium">{item.childCode}</td>
                        <td className="border border-gray-200 px-4 py-3 text-right font-medium">{item.quantity}</td>
                        <td className="border border-gray-200 px-4 py-3">{item.unit}</td>
                        {showExternalData && item.externalData && (
                          <>
                            <td className="border border-gray-200 px-4 py-3">
                              <div className="text-sm">
                                <div className="font-medium">{item.externalData.supplier_name}</div>
                                <div className="text-gray-500 text-xs">{item.externalData.supplier_code}</div>
                              </div>
                            </td>
                            <td className="border border-gray-200 px-4 py-3">
                              <div className="text-sm">
                                <div className="font-medium">{item.externalData.available_stock.toLocaleString()}</div>
                                <div className="text-gray-500 text-xs">/ {item.externalData.current_stock.toLocaleString()}</div>
                              </div>
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-center">
                              <Badge variant={item.externalData.quality_grade === 'A' ? 'default' : 
                                            item.externalData.quality_grade === 'B' ? 'secondary' : 'destructive'}>
                                {item.externalData.quality_grade}급
                              </Badge>
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-right">
                              <div className="text-sm font-medium">
                                ₩{item.externalData.last_purchase_price.toLocaleString()}
                              </div>
                            </td>
                          </>
                        )}
                        {showExternalData && !item.externalData && (
                          <>
                            <td className="border border-gray-200 px-4 py-3 text-gray-400">-</td>
                            <td className="border border-gray-200 px-4 py-3 text-gray-400">-</td>
                            <td className="border border-gray-200 px-4 py-3 text-gray-400">-</td>
                            <td className="border border-gray-200 px-4 py-3 text-gray-400">-</td>
                          </>
                        )}
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <div className="flex justify-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteBomItem(currentBom.id, item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
