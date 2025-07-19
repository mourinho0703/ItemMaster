
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, FileText, AlertTriangle, Info, Settings } from 'lucide-react';

const menuItems = [
  {
    title: '품목 등록',
    path: '/items',
    icon: Package,
  },
  {
    title: 'BOM 수정',
    path: '/bom',
    icon: FileText,
  },
  {
    title: 'BOM 오류 점검',
    path: '/validation',
    icon: AlertTriangle,
  },
  {
    title: '앱 소개',
    path: '/about',
    icon: Info,
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ItemMaster</h1>
            <p className="text-sm text-gray-500">제품 관리 시스템</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/items');
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
