
import React from 'react';
import { Package, FileText, AlertTriangle, Shield, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const About: React.FC = () => {
  const features = [
    {
      icon: Package,
      title: '품목 관리',
      description: '제품과 부품 정보를 체계적으로 등록하고 관리할 수 있습니다.',
      details: [
        '품목 코드 자동 생성',
        '카테고리별 분류 관리',
        '단가 및 재고 정보 추적',
        '품목 검색 및 필터링'
      ]
    },
    {
      icon: FileText,
      title: 'BOM 등록',
      description: '제품의 부품 구성표를 생성하고 다층 구조로 관리합니다.',
      details: [
        '다층 BOM 구조 지원',
        '부품 수량 및 단위 관리',
        'BOM 버전 관리',
        '구성 요소 관계 시각화'
      ]
    },
    {
      icon: AlertTriangle,
      title: '데이터 검증',
      description: 'BOM 데이터의 무결성을 자동으로 검증하고 오류를 탐지합니다.',
      details: [
        '순환 참조 탐지',
        '존재하지 않는 부품 검출',
        '수량 및 단위 오류 검사',
        '중복 항목 식별'
      ]
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: '데이터 무결성',
      description: '강력한 검증 시스템으로 데이터 품질을 보장합니다.'
    },
    {
      icon: Zap,
      title: '효율성 향상',
      description: '자동화된 프로세스로 작업 시간을 대폭 단축합니다.'
    },
    {
      icon: Users,
      title: '협업 지원',
      description: '팀 간 정보 공유와 협업을 원활하게 지원합니다.'
    }
  ];

  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-3">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">ItemMaster</h1>
            <p className="text-xl text-blue-600 font-medium">제품 관리 시스템</p>
          </div>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          제조업체를 위한 종합적인 품목 및 BOM 관리 솔루션입니다. 
          체계적인 데이터 관리와 강력한 검증 기능으로 생산성을 향상시키세요.
        </p>
      </div>

      {/* 주요 기능 소개 */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">주요 기능</h2>
          <p className="text-gray-600">ItemMaster가 제공하는 핵심 기능들을 소개합니다.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 시스템 이점 */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">시스템 이점</h2>
          <p className="text-gray-600">ItemMaster 도입으로 얻을 수 있는 주요 이점들입니다.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 기술 스택 */}
      <Card>
        <CardHeader>
          <CardTitle>기술 스택</CardTitle>
          <CardDescription>ItemMaster는 최신 웹 기술을 기반으로 구축되었습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">React</div>
              <div className="text-sm text-gray-600">프론트엔드</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">TypeScript</div>
              <div className="text-sm text-gray-600">타입 안정성</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">Tailwind</div>
              <div className="text-sm text-gray-600">스타일링</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">Shadcn/ui</div>
              <div className="text-sm text-gray-600">UI 컴포넌트</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 시작하기 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">시작해보세요</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            ItemMaster와 함께 체계적인 품목 관리와 BOM 관리를 시작하세요. 
            직관적인 인터페이스와 강력한 기능으로 생산성을 크게 향상시킬 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg">
              <Package className="w-4 h-4" />
              <span>품목 등록부터 시작</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg">
              <FileText className="w-4 h-4" />
              <span>BOM 구조 설계</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>데이터 검증 실행</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
