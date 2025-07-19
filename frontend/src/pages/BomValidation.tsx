
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ValidationError {
  id: string;
  type: 'missing_item' | 'circular_reference' | 'invalid_quantity' | 'duplicate_entry';
  severity: 'high' | 'medium' | 'low';
  bomCode: string;
  description: string;
  details: string;
}

export const BomValidation: React.FC = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([
    {
      id: '1',
      type: 'missing_item',
      severity: 'high',
      bomCode: 'PROD-001',
      description: '존재하지 않는 부품 참조',
      details: '부품코드 "MISSING-PART-001"이 품목 데이터베이스에 존재하지 않습니다.'
    },
    {
      id: '2',
      type: 'circular_reference',
      severity: 'high',
      bomCode: 'PROD-002',
      description: '순환 참조 발견',
      details: 'PROD-002 → SUB-001 → COMP-001 → PROD-002 경로에서 순환 참조가 발견되었습니다.'
    },
    {
      id: '3',
      type: 'invalid_quantity',
      severity: 'medium',
      bomCode: 'PROD-003',
      description: '잘못된 수량 값',
      details: '부품 "BOLT-M10-25"의 수량이 0 또는 음수로 설정되어 있습니다.'
    },
    {
      id: '4',
      type: 'duplicate_entry',
      severity: 'low',
      bomCode: 'PROD-001',
      description: '중복 부품 항목',
      details: '부품 "WASHER-M8"이 동일한 BOM에서 중복으로 등록되어 있습니다.'
    }
  ]);

  const handleValidation = async () => {
    setIsValidating(true);
    // 시뮬레이션용 딜레이
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsValidating(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'missing_item':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'circular_reference':
        return <RefreshCw className="w-5 h-5 text-red-500" />;
      case 'invalid_quantity':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'duplicate_entry':
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'missing_item':
        return '부품 누락';
      case 'circular_reference':
        return '순환 참조';
      case 'invalid_quantity':
        return '수량 오류';
      case 'duplicate_entry':
        return '중복 항목';
      default:
        return '알 수 없는 오류';
    }
  };

  const highSeverityCount = validationErrors.filter(e => e.severity === 'high').length;
  const mediumSeverityCount = validationErrors.filter(e => e.severity === 'medium').length;
  const lowSeverityCount = validationErrors.filter(e => e.severity === 'low').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">BOM 오류 점검</h1>
          <p className="text-gray-600 mt-2">BOM 데이터의 무결성을 검증하고 오류를 찾아냅니다.</p>
        </div>
        <Button 
          onClick={handleValidation} 
          disabled={isValidating}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isValidating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              검증 중...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              전체 검증 시작
            </>
          )}
        </Button>
      </div>

      {/* 검증 결과 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 오류</p>
                <p className="text-2xl font-bold text-gray-900">{validationErrors.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">높음</p>
                <p className="text-2xl font-bold text-red-600">{highSeverityCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">보통</p>
                <p className="text-2xl font-bold text-yellow-600">{mediumSeverityCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">낮음</p>
                <p className="text-2xl font-bold text-blue-600">{lowSeverityCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검증 규칙 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>검증 규칙</CardTitle>
          <CardDescription>다음 규칙에 따라 BOM 데이터를 검증합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">데이터 무결성 검사</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 존재하지 않는 부품 코드 참조</li>
                <li>• 잘못된 수량 값 (0, 음수, 비정상 값)</li>
                <li>• 중복된 부품 항목</li>
                <li>• 필수 필드 누락</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">구조적 검사</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 순환 참조 탐지</li>
                <li>• BOM 레벨 구조 검증</li>
                <li>• 상위-하위 관계 일치성</li>
                <li>• 단위 호환성 검사</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 오류 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>발견된 오류</CardTitle>
          <CardDescription>검증 과정에서 발견된 모든 오류를 심각도별로 표시합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {validationErrors.map((error) => (
              <div key={error.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(error.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{error.description}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(error.severity)}`}>
                          {error.severity === 'high' ? '높음' : error.severity === 'medium' ? '보통' : '낮음'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getTypeName(error.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">BOM: {error.bomCode}</p>
                      <p className="text-sm text-gray-700">{error.details}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      수정
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-500">
                      무시
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
