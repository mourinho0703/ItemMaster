
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, FileText, Settings, ChevronRight } from 'lucide-react';

type MenuItem = {
  title: string;
  path?: string;
  icon: React.ElementType;
  subItems?: {
    title: string;
    path: string;
  }[];
};

const menuItems: MenuItem[] = [
  {
    title: '품목 등록',
    icon: Package,
    subItems: [
      {
        title: '요청하기',
        path: '/items/request',
      },
      {
        title: '요청내역',
        path: '/items/history',
      },
    ],
  },
  {
    title: 'BOM 수정',
    icon: FileText,
    subItems: [
      {
        title: '요청하기',
        path: '/bom/request',
      },
      {
        title: '요청내역',
        path: '/bom/history',
      },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  const isPathActive = (path: string) => {
    return location.pathname === path;
  };

  const isMenuActive = (item: MenuItem) => {
    if (item.path) {
      return isPathActive(item.path);
    }
    if (item.subItems) {
      return item.subItems.some(sub => isPathActive(sub.path));
    }
    return false;
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ItemMaster</h1>
            <p className="text-sm text-gray-500">품목 관리 시스템</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = !!item.subItems;
            const isHovered = hoveredMenu === item.title;
            const isActive = isMenuActive(item);
            
            return (
              <li 
                key={item.title}
                onMouseEnter={() => hasSubItems && setHoveredMenu(item.title)}
                onMouseLeave={() => hasSubItems && setHoveredMenu(null)}
                className="relative"
              >
                {hasSubItems ? (
                  <div>
                    <div
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isHovered ? 'rotate-90' : ''}`} />
                    </div>
                    {isHovered && (
                      <ul className="mt-2 ml-8 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        {item.subItems.map((subItem) => {
                          const isSubActive = isPathActive(subItem.path);
                          return (
                            <li key={subItem.path}>
                              <Link
                                to={subItem.path}
                                className={`
                                  block px-4 py-2 rounded-lg text-sm transition-colors duration-200
                                  ${isSubActive
                                    ? 'bg-blue-100 text-blue-800 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                  }
                                `}
                              >
                                {subItem.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path!}
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
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
