function Tabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'search', label: '🔍 Search', icon: '✈️' },
    { id: 'history', label: '📜 History', icon: '🕐' },
    { id: 'saved', label: '⭐ Saved', icon: '💾' }
  ];

  return (
    <div className="flex gap-2 mb-6 border-b border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white rounded-t-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 rounded-t-lg'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;