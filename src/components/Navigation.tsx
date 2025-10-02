import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Screen } from '../types';

interface NavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
}

const Navigation: React.FC = () => {
  const { currentScreen, navigateTo } = useApp();

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
          <path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z" />
        </svg>
      ),
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
          <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z" />
        </svg>
      ),
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
          <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex gap-2 border-t border-border-primary bg-secondary-bg px-4 pb-3 pt-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => navigateTo(item.id)}
          className={`nav-item ${currentScreen === item.id ? 'active' : ''}`}
        >
          <div className="flex h-8 items-center justify-center">
            {item.icon}
          </div>
          <p className="text-xs font-medium leading-normal tracking-[0.015em]">
            {item.label}
          </p>
        </button>
      ))}
    </div>
  );
};

export default Navigation;