import React, { useState } from 'react';
import { ArrowLeft, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

interface SpecificationData {
  id: string;
  width: string;
  depth: string;
  height: string;
  tier: string;
}

export const SpecificationSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSpec, setSelectedSpec] = useState({
    width: '',
    depth: '',
    height: '',
    tier: ''
  });
  const [specifications, setSpecifications] = useState<SpecificationData[]>([]);

  const widthOptions = ['400', '500', '600', '700', '800', '900', '1000', '1100', '1200'];
  const depthOptions = ['400', '500', '600'];
  const heightOptions = ['600', '750', '900', '1200', '1350', '1500', '1650', '1800', '1950', '2100', '2400'];
  const tierOptions = ['2S', '3S', '4S', '단추가'];

  const handleSpecChange = (field: string, value: string) => {
    setSelectedSpec(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSpecification = () => {
    if (selectedSpec.width && selectedSpec.depth && selectedSpec.height && selectedSpec.tier) {
      const newSpec: SpecificationData = {
        id: Date.now().toString(),
        width: selectedSpec.width,
        depth: selectedSpec.depth,
        height: selectedSpec.height,
        tier: selectedSpec.tier
      };

      setSpecifications(prev => [...prev, newSpec]);
      
      // 설정값 초기화하지 않음 (제거)
    }
  };

  const handleRemoveSpecification = (id: string) => {
    setSpecifications(prev => prev.filter(spec => spec.id !== id));
  };

  const handleGoBack = () => {
    navigate('/items/product');
  };

  const handleBOMRegistration = () => {
    // 규격 데이터를 localStorage에 저장
    localStorage.setItem('specificationData', JSON.stringify(specifications));
    navigate('/items/bom-registration');
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
            <h1 className="text-3xl font-bold text-gray-900">규격 선택</h1>
            <p className="text-gray-600 mt-2">완제품의 규격을 선택하고 등록합니다.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 규격 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-600">규격 선택</CardTitle>
            <CardDescription>가로, 세로, 높이, 단수를 선택하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="width">가로 (mm)</Label>
              <Select value={selectedSpec.width} onValueChange={(value) => handleSpecChange('width', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="가로 선택" />
                </SelectTrigger>
                <SelectContent>
                  {widthOptions.map(width => (
                    <SelectItem key={width} value={width}>{width}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="depth">세로 (mm)</Label>
              <Select value={selectedSpec.depth} onValueChange={(value) => handleSpecChange('depth', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="세로 선택" />
                </SelectTrigger>
                <SelectContent>
                  {depthOptions.map(depth => (
                    <SelectItem key={depth} value={depth}>{depth}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">높이 (mm)</Label>
              <Select value={selectedSpec.height} onValueChange={(value) => handleSpecChange('height', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="높이 선택" />
                </SelectTrigger>
                <SelectContent>
                  {heightOptions.map(height => (
                    <SelectItem key={height} value={height}>{height}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">단수</Label>
              <Select value={selectedSpec.tier} onValueChange={(value) => handleSpecChange('tier', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="단수 선택" />
                </SelectTrigger>
                <SelectContent>
                  {tierOptions.map(tier => (
                    <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleAddSpecification} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!selectedSpec.width || !selectedSpec.depth || !selectedSpec.height || !selectedSpec.tier}
              >
                <Plus className="w-4 h-4 mr-2" />
                추가하기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 오른쪽: 선택된 규격 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-600">등록된 규격</CardTitle>
            <CardDescription>선택된 규격들이 여기에 표시됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {specifications.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>아직 등록된 규격이 없습니다.</p>
                <p className="text-sm mt-2">왼쪽에서 규격을 선택하고 추가하세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {specifications.map((spec) => (
                  <div key={spec.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {spec.width} × {spec.depth} × {spec.height} × {spec.tier}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveSpecification(spec.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOM 등록 버튼 */}
      {specifications.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleBOMRegistration} className="bg-blue-600 hover:bg-blue-700">
            <ChevronRight className="w-4 h-4 mr-2" />
            BOM 등록
          </Button>
        </div>
      )}
    </div>
  );
}; 