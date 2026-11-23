// The row of tabs at the top of the page. It only reports clicks; App decides which page shows.
export interface Tab<T extends string> {
  id: T;
  label: string;
}

// React: props are the component's read-only inputs. The callback `onSelect` is how a child
// talks back to its parent, similar to passing a listener object in Java.
interface TabBarProps<T extends string> {
  tabs: Tab<T>[];
  activeId: T;
  onSelect: (id: T) => void;
}

export function TabBar<T extends string>({ tabs, activeId, onSelect }: TabBarProps<T>) {
  return (
    <nav className="tab-bar" aria-label="Main">
      {tabs.map((tab) => (
        // React: when rendering a list, each item needs a unique `key` so React can tell
        // which item is which between renders (like a primary key).
        <button
          key={tab.id}
          type="button"
          className={tab.id === activeId ? 'tab active' : 'tab'}
          aria-current={tab.id === activeId ? 'page' : undefined}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
