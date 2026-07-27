import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { playTabSound } from '../utils/sound';

const tabs = [
  { key: '/', title: '首页', icon: '🏠', activeIcon: '💖' },
  { key: '/bills', title: '账单', icon: '📋', activeIcon: '📝' },
  { key: '/add', title: '记账', icon: '✏️', activeIcon: '🌟' },
  { key: '/statistics', title: '统计', icon: '📊', activeIcon: '✨' },
  { key: '/accounts', title: '账户', icon: '💳', activeIcon: '💎' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  return (
    <div className="app-container">
      <div className="app-content">
        <Outlet />
      </div>
      <div className="app-tabbar">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '6px 0 4px',
          }}
        >
          {tabs.map((tab) => {
            const isActive = currentPath === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  playTabSound();
                  navigate(tab.key);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  transition: 'transform 0.2s',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <span
                  style={{
                    fontSize: isActive ? 26 : 22,
                    transition: 'all 0.3s ease',
                    filter: isActive ? 'none' : 'grayscale(30%)',
                  }}
                >
                  {isActive ? tab.activeIcon : tab.icon}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ff85c0' : '#b0b0b0',
                    transition: 'color 0.3s',
                  }}
                >
                  {tab.title}
                </span>
                {isActive && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      background: '#ff85c0',
                      marginTop: 1,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
