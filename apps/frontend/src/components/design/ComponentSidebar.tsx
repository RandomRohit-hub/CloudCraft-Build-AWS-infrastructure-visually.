import { useState, useMemo } from 'react';
import type { DesignResourceCategory, DesignResourceType } from '@/design/types';
import { AWS_CATALOG, CATEGORY_LABELS } from '@/design/catalog';

interface ComponentSidebarProps {
  beginnerMode: boolean;
  onAddNode: (type: DesignResourceType) => void;
}

export function ComponentSidebar({ beginnerMode, onAddNode }: ComponentSidebarProps) {
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Group catalog items by category
  const categories = useMemo(() => {
    const list: DesignResourceCategory[] = [
      'networking',
      'compute',
      'database',
      'load_balancing',
      'security',
      'storage',
    ];

    const searchLower = search.toLowerCase();

    return list
      .map((cat) => {
        const meta = CATEGORY_LABELS[cat];
        const items = AWS_CATALOG.filter(
          (item) =>
            item.category === cat &&
            (searchLower === '' ||
              item.name.toLowerCase().includes(searchLower) ||
              item.awsServiceName.toLowerCase().includes(searchLower) ||
              item.description.toLowerCase().includes(searchLower)),
        );
        return { category: cat, meta, items };
      })
      .filter((g) => g.items.length > 0);
  }, [search]);

  const onDragStart = (event: React.DragEvent, nodeType: DesignResourceType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 flex flex-col h-full bg-neutral-950 border-r border-neutral-800 select-none z-10 shrink-0">
      {/* Search Header */}
      <div className="p-3.5 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold tracking-wider uppercase text-neutral-500">
            AWS Components
          </h2>
          <span className="text-[11px] font-mono text-neutral-600">
            {AWS_CATALOG.length} resources
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search AWS services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          />
          <svg
            className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-2 text-neutral-600 hover:text-orange-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Beginner Guide Banner if Beginner Mode is active */}
      {beginnerMode && (
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[11px] leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold mb-0.5">
            <svg className="h-3.5 w-3.5 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a3 3 0 10-6 0 3 3 0 006 0z" />
            </svg>
            <span>Beginner Assist Active</span>
          </div>
          Drag any component onto the canvas to place it, or click to add directly.
        </div>
      )}

      {/* Component Categories List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {categories.map(({ category, meta, items }) => {
          const isCollapsed = collapsedCategories[category];

          return (
            <div key={category} className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: meta.iconColor }}
                  />
                  <span className="text-xs font-semibold text-neutral-300">
                    {meta.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-500 font-mono">
                    {items.length}
                  </span>
                  <svg
                    className={`h-3 w-3 text-neutral-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {/* Category Items */}
              {!isCollapsed && (
                <div className="p-1.5 pt-0 space-y-1.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type)}
                        onClick={() => onAddNode(item.type)}
                        className="group flex items-start gap-2.5 p-2 rounded-lg border border-transparent hover:border-neutral-700 bg-neutral-950/60 hover:bg-neutral-800 cursor-grab active:cursor-grabbing hover:shadow-sm hover:shadow-orange-500/10 transition-all"
                        title={item.description}
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md mt-0.5 transition-transform group-hover:scale-105"
                          style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}25` }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-300 truncate group-hover:text-orange-400">
                              {item.name}
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-neutral-600 font-mono transition-opacity">
                              drag
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5 leading-tight">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
