import React from 'react'

interface BomOperationIconProps {
  className?: string
}

export const BomCreateIcon: React.FC<BomOperationIconProps> = ({ className = "w-full h-24" }) => (
  <svg viewBox="0 0 200 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <style>{`
      @keyframes fadeInGrowHorizontal {
        0% {
          transform: scaleX(0);
          opacity: 0;
        }
        50% {
          transform: scaleX(1);
          opacity: 0.5;
        }
        100% {
          transform: scaleX(1);
          opacity: 1;
        }
      }
      @keyframes scaleIcon {
        0%, 100% {
          transform: scale(1) translate(0, 0);
        }
        50% {
          transform: scale(1.2) translate(0, 0);
        }
      }
      .new-row {
        animation: fadeInGrowHorizontal 2s ease-out infinite;
        transform-origin: left center;
      }
      .plus-icon {
        animation: scaleIcon 2s ease-in-out infinite;
        transform-origin: 200px 71px;
      }
    `}</style>
    
    {/* BOM 리스트 테이블 */}
    <rect x="20" y="15" width="160" height="70" fill="#f0f9ff" stroke="#3b82f6" strokeWidth="2" rx="4"/>
    
    {/* 기존 행들 */}
    <rect x="25" y="20" width="150" height="12" fill="#dbeafe" rx="2"/>
    <rect x="25" y="35" width="150" height="12" fill="#dbeafe" rx="2"/>
    <rect x="25" y="50" width="150" height="12" fill="#dbeafe" rx="2"/>
    
    {/* 신규 생성되는 행 (제자리에서 페이드인+확장) */}
    <rect className="new-row" x="25" y="65" width="150" height="12" fill="#22c55e" fillOpacity="0.3" stroke="#22c55e" strokeWidth="1.5" rx="2"/>
    
    {/* + 아이콘 제거 */}
  </svg>
)

export const BomUpdateIcon: React.FC<BomOperationIconProps> = ({ className = "w-full h-24" }) => (
  <svg viewBox="0 0 200 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <style>{`
      @keyframes pulseUpdate {
        0%, 100% {
          fill-opacity: 0.3;
        }
        50% {
          fill-opacity: 0.8;
        }
      }
      @keyframes slideArrow {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(3px);
        }
      }
      @keyframes fadeOldRow {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.3;
        }
      }
      .update-row {
        animation: pulseUpdate 2s ease-in-out infinite;
      }
      .arrow-move {
        animation: slideArrow 2s ease-in-out infinite;
        transform-origin: center;
      }
      .old-row {
        animation: fadeOldRow 2s ease-in-out infinite;
      }
    `}</style>
    
    {/* BOM 리스트 테이블 */}
    <rect x="20" y="15" width="160" height="70" fill="#fff7ed" stroke="#f97316" strokeWidth="2" rx="4"/>
    
    {/* 기존 행들 */}
    <rect x="25" y="20" width="150" height="12" fill="#fed7aa" rx="2"/>
    <rect x="25" y="35" width="150" height="12" fill="#fed7aa" rx="2"/>
    
    {/* 변경되는 행 (이전 - 빨간색 계열로 사라짐) */}
    <rect className="old-row" x="25" y="50" width="150" height="12" fill="#fca5a5" fillOpacity="0.5" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2" rx="2"/>
    
    {/* 변경되는 행 (이후 - 초록색 계열로 생성) */}
    <rect className="update-row" x="25" y="65" width="150" height="12" fill="#86efac" fillOpacity="0.4" stroke="#22c55e" strokeWidth="1.5" rx="2"/>
    
    {/* 변경 아이콘 제거 */}
  </svg>
)

export const BomDeleteIcon: React.FC<BomOperationIconProps> = ({ className = "w-full h-24" }) => (
  <svg viewBox="0 0 200 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <style>{`
      @keyframes fadeOutShrinkHorizontal {
        0% {
          transform: scaleX(1);
          opacity: 1;
        }
        50% {
          transform: scaleX(1);
          opacity: 0.5;
        }
        100% {
          transform: scaleX(0);
          opacity: 0;
        }
      }
      .delete-row {
        animation: fadeOutShrinkHorizontal 2s ease-out infinite;
        transform-origin: right center;
      }
    `}</style>
    
    {/* BOM 리스트 테이블 */}
    <rect x="20" y="15" width="160" height="70" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" rx="4"/>
    
    {/* 기존 행들 */}
    <rect x="25" y="20" width="150" height="12" fill="#fecaca" rx="2"/>
    <rect x="25" y="35" width="150" height="12" fill="#fecaca" rx="2"/>
    <rect x="25" y="50" width="150" height="12" fill="#fecaca" rx="2"/>
    
    {/* 삭제되는 행 (오른쪽→왼쪽으로 축소+페이드아웃) */}
    <rect className="delete-row" x="25" y="65" width="150" height="12" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="1.5" rx="2"/>
    
    {/* X 아이콘 제거 */}
  </svg>
)

