# Vuexy Widget Catalog - Complete Component Reference
## HTML/CSS Patterns for LMS Platform Implementation

> **Source:** Vuexy HTML Admin Template  
> **Purpose:** Reference guide for all available Vuexy components  
> **Usage:** Use these patterns for web portal and admin panel  
> **Last Updated:** February 27, 2026

---

## 📋 TABLE OF CONTENTS

1. [Card Components](#card-components)
2. [Statistics Cards](#statistics-cards)
3. [Progress & Metrics](#progress--metrics)
4. [Lists & Tables](#lists--tables)
5. [Navigation Components](#navigation-components)
6. [Form Elements](#form-elements)
7. [Buttons & Actions](#buttons--actions)
8. [Badges & Labels](#badges--labels)
9. [Charts & Graphs](#charts--graphs)
10. [Layout Patterns](#layout-patterns)

---

## 🎴 CARD COMPONENTS

### 1. Basic Card
**Use Case:** General content container, quiz cards, course cards

**HTML Pattern:**
```html
<div class="card">
  <div class="card-body">
    <h5 class="card-title">Card Title</h5>
    <p class="card-text">
      Some quick example text to build on the card title and make up 
      the bulk of the card's content.
    </p>
    <a href="#" class="btn btn-primary">Go somewhere</a>
  </div>
</div>
```

**React/Next.js Implementation:**
```tsx
// packages/ui/src/Card/BasicCard.tsx
interface BasicCardProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const BasicCard: React.FC<BasicCardProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <p className="card-text">{description}</p>
        {actionLabel && onAction && (
          <button onClick={onAction} className="btn btn-primary">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
```

**Mobile (React Native) Equivalent:**
```tsx
// mobile/components/ui/BasicCard.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColor';

export const BasicCard = ({ title, description, actionLabel, onAction }) => {
  const colors = useThemeColors();
  
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <Pressable 
          onPress={onAction}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};
```

---

### 2. Card with Image
**Use Case:** Quiz thumbnails, course covers, featured content

**HTML Pattern:**
```html
<div class="card">
  <img src="image.jpg" class="card-img-top" alt="Card image">
  <div class="card-body">
    <h5 class="card-title">Card Title</h5>
    <p class="card-text">Supporting text below as a natural lead-in.</p>
    <a href="#" class="btn btn-primary">View Details</a>
  </div>
</div>
```

**React Implementation:**
```tsx
// packages/ui/src/Card/ImageCard.tsx
import Image from 'next/image';

interface ImageCardProps {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  imageAlt,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="card">
      <Image 
        src={image} 
        alt={imageAlt}
        width={400}
        height={200}
        className="card-img-top"
      />
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <p className="card-text">{description}</p>
        {actionLabel && onAction && (
          <button onClick={onAction} className="btn btn-primary">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
```

---

### 3. Horizontal Card
**Use Case:** Quiz results, course progress, activity feed

**HTML Pattern:**
```html
<div class="card mb-3">
  <div class="row g-0">
    <div class="col-md-4">
      <img src="image.jpg" class="img-fluid rounded-start" alt="...">
    </div>
    <div class="col-md-8">
      <div class="card-body">
        <h5 class="card-title">Card title</h5>
        <p class="card-text">This is a wider card with supporting text.</p>
        <p class="card-text">
          <small class="text-muted">Last updated 3 mins ago</small>
        </p>
      </div>
    </div>
  </div>
</div>
```

**React Implementation:**
```tsx
// packages/ui/src/Card/HorizontalCard.tsx
export const HorizontalCard: React.FC<{
  image: string;
  title: string;
  description: string;
  timestamp?: string;
}> = ({ image, title, description, timestamp }) => {
  return (
    <div className="card mb-3">
      <div className="row g-0">
        <div className="col-md-4">
          <Image 
            src={image} 
            alt={title}
            width={300}
            height={200}
            className="img-fluid rounded-start"
          />
        </div>
        <div className="col-md-8">
          <div className="card-body">
            <h5 className="card-title">{title}</h5>
            <p className="card-text">{description}</p>
            {timestamp && (
              <p className="card-text">
                <small className="text-muted">{timestamp}</small>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

### 4. Colored Cards (Variants)
**Use Case:** Status indicators, category badges, alert cards

**HTML Pattern:**
```html
<!-- Primary -->
<div class="card text-white bg-primary">
  <div class="card-body">
    <h5 class="card-title">Primary card title</h5>
    <p class="card-text">Some quick example text.</p>
  </div>
</div>

<!-- Success -->
<div class="card text-white bg-success">
  <div class="card-body">
    <h5 class="card-title">Success card title</h5>
    <p class="card-text">Some quick example text.</p>
  </div>
</div>

<!-- Danger -->
<div class="card text-white bg-danger">
  <div class="card-body">
    <h5 class="card-title">Danger card title</h5>
    <p class="card-text">Some quick example text.</p>
  </div>
</div>

<!-- Warning -->
<div class="card text-dark bg-warning">
  <div class="card-body">
    <h5 class="card-title">Warning card title</h5>
    <p class="card-text">Some quick example text.</p>
  </div>
</div>
```

**React Implementation:**
```tsx
// packages/ui/src/Card/ColoredCard.tsx
type CardVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'secondary';

interface ColoredCardProps {
  variant: CardVariant;
  title: string;
  description: string;
}

export const ColoredCard: React.FC<ColoredCardProps> = ({
  variant,
  title,
  description,
}) => {
  const textClass = variant === 'warning' ? 'text-dark' : 'text-white';
  
  return (
    <div className={`card ${textClass} bg-${variant}`}>
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <p className="card-text">{description}</p>
      </div>
    </div>
  );
};
```

---

### 5. Outline Cards
**Use Case:** Subtle emphasis, secondary content, optional features

**HTML Pattern:**
```html
<div class="card border-primary">
  <div class="card-body text-primary">
    <h5 class="card-title">Primary card title</h5>
    <p class="card-text">Some quick example text.</p>
  </div>
</div>
```

---

## 📊 STATISTICS CARDS

### 1. Simple Stat Card
**Use Case:** Dashboard metrics, KPIs, user stats

**HTML Pattern:**
```html
<div class="card">
  <div class="card-body">
    <div class="d-flex align-items-center">
      <div class="avatar bg-light-primary rounded">
        <div class="avatar-content">
          <i class="icon-shopping-cart font-medium-5"></i>
        </div>
      </div>
      <div class="ms-3">
        <h2 class="fw-bolder mb-0">97.8k</h2>
        <p class="card-text">Orders</p>
      </div>
    </div>
  </div>
</div>
```

**React Implementation:**
```tsx
// packages/ui/src/Card/StatCard.tsx
interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  variant = 'primary',
}) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className={`avatar bg-light-${variant} rounded`}>
            <div className="avatar-content">{icon}</div>
          </div>
          <div className="ms-3">
            <h2 className="fw-bolder mb-0">{value}</h2>
            <p className="card-text">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Mobile Implementation:**
```tsx
// mobile/components/ui/StatCard.tsx (Already implemented in index.tsx)
// See mobile/app/(tabs)/index.tsx StatCard component
```

---

### 2. Stat Card with Trend
**Use Case:** Growth metrics, performance indicators, comparisons

**HTML Pattern:**
```html
<div class="card">
  <div class="card-body">
    <div class="d-flex justify-content-between">
      <div>
        <h2 class="fw-bolder mb-0">$4,673</h2>
        <p class="card-text">Total Sales</p>
      </div>
      <div class="avatar bg-light-success">
        <div class="avatar-content">
          <i class="icon-trending-up"></i>
        </div>
      </div>
    </div>
    <div class="d-flex align-items-center mt-2">
      <span class="badge bg-light-success">+25.2%</span>
      <span class="ms-2 text-muted">vs last week</span>
    </div>
  </div>
</div>
```

**React Implementation:**
```tsx
// packages/ui/src/Card/TrendStatCard.tsx
interface TrendStatCardProps {
  value: string | number;
  label: string;
  trend: number; // positive or negative percentage
  trendLabel?: string;
  icon: React.ReactNode;
}

export const TrendStatCard: React.FC<TrendStatCardProps> = ({
  value,
  label,
  trend,
  trendLabel = 'vs last week',
  icon,
}) => {
  const isPositive = trend >= 0;
  const trendVariant = isPositive ? 'success' : 'danger';
  const trendIcon = isPositive ? '↑' : '↓';
  
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between">
          <div>
            <h2 className="fw-bolder mb-0">{value}</h2>
            <p className="card-text">{label}</p>
          </div>
          <div className={`avatar bg-light-${trendVariant}`}>
            <div className="avatar-content">{icon}</div>
          </div>
        </div>
        <div className="d-flex align-items-center mt-2">
          <span className={`badge bg-light-${trendVariant}`}>
            {trendIcon} {Math.abs(trend)}%
          </span>
          <span className="ms-2 text-muted">{trendLabel}</span>
        </div>
      </div>
    </div>
  );
};
```

---

### 3. Progress Stat Card
**Use Case:** Course completion, quiz progress, goal tracking

**HTML Pattern:**
```html
<div class="card">
  <div class="card-body">
    <div class="d-flex justify-content-between align-items-center mb-1">
      <span>CPU Usage</span>
      <span class="fw-bolder">86%</span>
    </div>
    <div class="progress progress-bar-primary" style="height: 6px;">
      <div class="progress-bar" role="progressbar" 
           style="width: 86%;" aria-valuenow="86" 
           aria-valuemin="0" aria-valuemax="100">
      </div>
    </div>
  </div>
</div>
```

**React Implementation:**
```tsx
// packages/ui/src/Card/ProgressStatCard.tsx
interface ProgressStatCardProps {
  label: string;
  value: number; // 0-100
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showPercentage?: boolean;
}

export const ProgressStatCard: React.FC<ProgressStatCardProps> = ({
  label,
  value,
  variant = 'primary',
  showPercentage = true,
}) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span>{label}</span>
          {showPercentage && (
            <span className="fw-bolder">{value}%</span>
          )}
        </div>
        <div className={`progress progress-bar-${variant}`} style={{ height: '6px' }}>
          <div 
            className="progress-bar" 
            role="progressbar" 
            style={{ width: `${value}%` }}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </div>
  );
};
```

---


## 📈 PROGRESS & METRICS

### 1. Circular Progress
**Use Case:** Quiz scores, completion rates, skill levels

**HTML Pattern:**
```html
<div class="card">
  <div class="card-body text-center">
    <div class="avatar bg-light-primary p-50 mb-1">
      <div class="avatar-content">
        <i class="icon-award font-medium-5"></i>
      </div>
    </div>
    <h2 class="fw-bolder">82.5k</h2>
    <p class="card-text">Expenses</p>
  </div>
</div>
```

**React with Chart.js:**
```tsx
// packages/ui/src/Progress/CircularProgress.tsx
import { Doughnut } from 'react-chartjs-2';

interface CircularProgressProps {
  value: number; // 0-100
  label: string;
  size?: number;
  color?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  label,
  size = 120,
  color = '#7367F0',
}) => {
  const data = {
    datasets: [{
      data: [value, 100 - value],
      backgroundColor: [color, '#E8E8E8'],
      borderWidth: 0,
    }],
  };

  const options = {
    cutout: '80%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  return (
    <div className="text-center">
      <div style={{ width: size, height: size, position: 'relative', margin: '0 auto' }}>
        <Doughnut data={data} options={options} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
          <h3 className="fw-bolder mb-0">{value}%</h3>
        </div>
      </div>
      <p className="mt-2">{label}</p>
    </div>
  );
};
```

---

### 2. Linear Progress Bar
**Use Case:** Quiz timer, upload progress, loading states

**HTML Pattern:**
```html
<!-- Default -->
<div class="progress">
  <div class="progress-bar" role="progressbar" 
       style="width: 25%;" aria-valuenow="25" 
       aria-valuemin="0" aria-valuemax="100">
  </div>
</div>

<!-- With label -->
<div class="progress">
  <div class="progress-bar" role="progressbar" 
       style="width: 75%;" aria-valuenow="75" 
       aria-valuemin="0" aria-valuemax="100">
    75%
  </div>
</div>

<!-- Striped animated -->
<div class="progress">
  <div class="progress-bar progress-bar-striped progress-bar-animated" 
       role="progressbar" style="width: 50%;" 
       aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
  </div>
</div>
```

**React Implementation:**
```tsx
// packages/ui/src/Progress/LinearProgress.tsx
interface LinearProgressProps {
  value: number; // 0-100
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  striped?: boolean;
  animated?: boolean;
  showLabel?: boolean;
  height?: number;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  value,
  variant = 'primary',
  striped = false,
  animated = false,
  showLabel = false,
  height = 6,
}) => {
  const progressClasses = [
    'progress-bar',
    `bg-${variant}`,
    striped && 'progress-bar-striped',
    animated && 'progress-bar-animated',
  ].filter(Boolean).join(' ');

  return (
    <div className="progress" style={{ height: `${height}px` }}>
      <div 
        className={progressClasses}
        role="progressbar" 
        style={{ width: `${value}%` }}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {showLabel && `${value}%`}
      </div>
    </div>
  );
};
```

---

### 3. Multi-Progress Bar
**Use Case:** Category breakdown, skill distribution, time allocation

**HTML Pattern:**
```html
<div class="progress">
  <div class="progress-bar bg-primary" role="progressbar" 
       style="width: 35%;" aria-valuenow="35" 
       aria-valuemin="0" aria-valuemax="100">
    UI Design 35%
  </div>
  <div class="progress-bar bg-success" role="progressbar" 
       style="width: 20%;" aria-valuenow="20" 
       aria-valuemin="0" aria-valuemax="100">
    UX 20%
  </div>
  <div class="progress-bar bg-warning" role="progressbar" 
       style="width: 14%;" aria-valuenow="14" 
       aria-valuemin="0" aria-valuemax="100">
    Music 14%
  </div>
</div>
```

**React Implementation:**
```tsx
// packages/ui/src/Progress/MultiProgress.tsx
interface ProgressSegment {
  label: string;
  value: number;
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

interface MultiProgressProps {
  segments: ProgressSegment[];
  height?: number;
  showLabels?: boolean;
}

export const MultiProgress: React.FC<MultiProgressProps> = ({
  segments,
  height = 20,
  showLabels = true,
}) => {
  return (
    <div className="progress" style={{ height: `${height}px` }}>
      {segments.map((segment, index) => (
        <div 
          key={index}
          className={`progress-bar bg-${segment.variant}`}
          role="progressbar" 
          style={{ width: `${segment.value}%` }}
          aria-valuenow={segment.value}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {showLabels && `${segment.label} ${segment.value}%`}
        </div>
      ))}
    </div>
  );
};
```

---

## 📋 LISTS & TABLES

### 1. List Group
**Use Case:** Quiz questions list, navigation menu, settings options

**HTML Pattern:**
```html
<ul class="list-group">
  <li class="list-group-item">Cras justo odio</li>
  <li class="list-group-item">Dapibus ac facilisis in</li>
  <li class="list-group-item active">Vestibulum at eros</li>
  <li class="list-group-item">Porta ac consectetur ac</li>
</ul>

<!-- With badges -->
<ul class="list-group">
  <li class="list-group-item d-flex justify-content-between align-items-center">
    Cras justo odio
    <span class="badge bg-primary rounded-pill">14</span>
  </li>
  <li class="list-group-item d-flex justify-content-between align-items-center">
    Dapibus ac facilisis in
    <span class="badge bg-primary rounded-pill">2</span>
  </li>
</ul>
```

**React Implementation:**
```tsx
// packages/ui/src/List/ListGroup.tsx
interface ListItem {
  id: string;
  label: string;
  badge?: number | string;
  active?: boolean;
  onClick?: () => void;
}

interface ListGroupProps {
  items: ListItem[];
  showBadges?: boolean;
}

export const ListGroup: React.FC<ListGroupProps> = ({
  items,
  showBadges = false,
}) => {
  return (
    <ul className="list-group">
      {items.map((item) => (
        <li 
          key={item.id}
          className={`list-group-item ${item.active ? 'active' : ''} ${
            item.onClick ? 'list-group-item-action' : ''
          } ${showBadges ? 'd-flex justify-content-between align-items-center' : ''}`}
          onClick={item.onClick}
          style={{ cursor: item.onClick ? 'pointer' : 'default' }}
        >
          {item.label}
          {showBadges && item.badge && (
            <span className="badge bg-primary rounded-pill">{item.badge}</span>
          )}
        </li>
      ))}
    </ul>
  );
};
```

---

### 2. Data Table
**Use Case:** User management, quiz results, leaderboard

**HTML Pattern:**
```html
<div class="table-responsive">
  <table class="table">
    <thead>
      <tr>
        <th>Course Name</th>
        <th>Time</th>
        <th>Progress</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>UI Design</td>
        <td>2h 30m</td>
        <td>
          <div class="progress" style="height: 6px;">
            <div class="progress-bar bg-primary" style="width: 75%;"></div>
          </div>
        </td>
        <td><span class="badge bg-light-success">Completed</span></td>
      </tr>
      <tr>
        <td>React Basics</td>
        <td>1h 45m</td>
        <td>
          <div class="progress" style="height: 6px;">
            <div class="progress-bar bg-warning" style="width: 45%;"></div>
          </div>
        </td>
        <td><span class="badge bg-light-warning">In Progress</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

**React Implementation:**
```tsx
// packages/ui/src/Table/DataTable.tsx
interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  striped = false,
  hover = true,
  bordered = false,
}: DataTableProps<T>) {
  const tableClasses = [
    'table',
    striped && 'table-striped',
    hover && 'table-hover',
    bordered && 'table-bordered',
  ].filter(Boolean).join(' ');

  return (
    <div className="table-responsive">
      <table className={tableClasses}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={String(column.key)}>
                  {column.render 
                    ? column.render(row[column.key], row)
                    : String(row[column.key])
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🎯 BADGES & LABELS

### 1. Basic Badges
**Use Case:** Status indicators, category tags, notifications

**HTML Pattern:**
```html
<span class="badge bg-primary">Primary</span>
<span class="badge bg-success">Success</span>
<span class="badge bg-danger">Danger</span>
<span class="badge bg-warning">Warning</span>
<span class="badge bg-info">Info</span>

<!-- Rounded pill -->
<span class="badge rounded-pill bg-primary">Primary</span>

<!-- Light variants -->
<span class="badge bg-light-primary">Primary</span>
<span class="badge bg-light-success">Success</span>
```

**React Implementation:**
```tsx
// packages/ui/src/Badge/Badge.tsx
type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'secondary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  light?: boolean;
  pill?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  light = false,
  pill = false,
  className = '',
}) => {
  const badgeClasses = [
    'badge',
    light ? `bg-light-${variant}` : `bg-${variant}`,
    pill && 'rounded-pill',
    className,
  ].filter(Boolean).join(' ');

  return <span className={badgeClasses}>{children}</span>;
};
```

---

## 🔘 BUTTONS & ACTIONS

### 1. Button Variants
**Use Case:** Primary actions, secondary actions, destructive actions

**HTML Pattern:**
```html
<!-- Solid buttons -->
<button type="button" class="btn btn-primary">Primary</button>
<button type="button" class="btn btn-success">Success</button>
<button type="button" class="btn btn-danger">Danger</button>
<button type="button" class="btn btn-warning">Warning</button>

<!-- Outline buttons -->
<button type="button" class="btn btn-outline-primary">Primary</button>
<button type="button" class="btn btn-outline-success">Success</button>

<!-- Flat buttons -->
<button type="button" class="btn btn-flat-primary">Primary</button>

<!-- Icon buttons -->
<button type="button" class="btn btn-icon btn-primary">
  <i class="icon-heart"></i>
</button>

<!-- Button with icon -->
<button type="button" class="btn btn-primary">
  <i class="icon-plus me-1"></i>
  Add New
</button>
```

**React Implementation:**
```tsx
// packages/ui/src/Button/Button.tsx
type ButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'secondary';
type ButtonStyle = 'solid' | 'outline' | 'flat';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  style?: ButtonStyle;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  style = 'solid',
  size = 'md',
  icon,
  iconPosition = 'left',
  iconOnly = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
}) => {
  const buttonClasses = [
    'btn',
    style === 'solid' && `btn-${variant}`,
    style === 'outline' && `btn-outline-${variant}`,
    style === 'flat' && `btn-flat-${variant}`,
    size !== 'md' && `btn-${size}`,
    iconOnly && 'btn-icon',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="spinner-border spinner-border-sm me-1" />}
      {!loading && icon && iconPosition === 'left' && (
        <span className={!iconOnly ? 'me-1' : ''}>{icon}</span>
      )}
      {!iconOnly && children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ms-1">{icon}</span>
      )}
    </button>
  );
};
```

---

## 📐 LAYOUT PATTERNS

### 1. Grid System
**Use Case:** Responsive layouts, dashboard grids, card layouts

**HTML Pattern:**
```html
<div class="row">
  <div class="col-12 col-md-6 col-lg-4">
    <!-- Card 1 -->
  </div>
  <div class="col-12 col-md-6 col-lg-4">
    <!-- Card 2 -->
  </div>
  <div class="col-12 col-md-6 col-lg-4">
    <!-- Card 3 -->
  </div>
</div>

<!-- With gaps -->
<div class="row g-3">
  <div class="col-md-4">
    <!-- Content -->
  </div>
  <div class="col-md-8">
    <!-- Content -->
  </div>
</div>
```

---

### 2. Card Grid
**Use Case:** Quiz grid, course catalog, dashboard widgets

**HTML Pattern:**
```html
<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
  <div class="col">
    <div class="card h-100">
      <img src="..." class="card-img-top" alt="...">
      <div class="card-body">
        <h5 class="card-title">Card title</h5>
        <p class="card-text">This is a longer card.</p>
      </div>
    </div>
  </div>
  <!-- Repeat for more cards -->
</div>
```

---

### 3. Sidebar Layout
**Use Case:** Admin panel, settings page, profile page

**HTML Pattern:**
```html
<div class="row">
  <!-- Sidebar -->
  <div class="col-12 col-lg-3">
    <div class="card">
      <div class="card-body">
        <ul class="nav flex-column">
          <li class="nav-item">
            <a class="nav-link active" href="#">Dashboard</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Profile</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Settings</a>
          </li>
        </ul>
      </div>
    </div>
  </div>
  
  <!-- Main content -->
  <div class="col-12 col-lg-9">
    <div class="card">
      <div class="card-body">
        <!-- Main content here -->
      </div>
    </div>
  </div>
</div>
```

---

## 🎨 COLOR SYSTEM

### Vuexy Color Palette
```css
/* Primary colors */
--vz-primary: #7367F0;
--vz-secondary: #82868B;
--vz-success: #28C76F;
--vz-danger: #EA5455;
--vz-warning: #FF9F43;
--vz-info: #00CFE8;

/* Light variants */
--vz-light-primary: rgba(115, 103, 240, 0.12);
--vz-light-success: rgba(40, 199, 111, 0.12);
--vz-light-danger: rgba(234, 84, 85, 0.12);
--vz-light-warning: rgba(255, 159, 67, 0.12);
--vz-light-info: rgba(0, 207, 232, 0.12);

/* Surface colors */
--vz-surface: #FFFFFF;
--vz-background: #F8F7FA;
--vz-text: #4B465C;
--vz-text-secondary: #A8AAAE;
--vz-border: #DBDADE;

/* Dark mode */
--vz-dark-surface: #2F2B3D;
--vz-dark-background: #25293C;
--vz-dark-text: #CFD3EC;
--vz-dark-text-secondary: #7C7E8C;
```

---

## 📱 RESPONSIVE BREAKPOINTS

```css
/* Vuexy breakpoints */
--vz-breakpoint-xs: 0;
--vz-breakpoint-sm: 576px;
--vz-breakpoint-md: 768px;
--vz-breakpoint-lg: 992px;
--vz-breakpoint-xl: 1200px;
--vz-breakpoint-xxl: 1400px;
```

**Usage in React:**
```tsx
// Responsive card grid
<div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
  {/* Cards */}
</div>

// Responsive visibility
<div className="d-none d-md-block">
  {/* Only visible on md and up */}
</div>

<div className="d-block d-md-none">
  {/* Only visible on mobile */}
</div>
```

---

## 🎯 IMPLEMENTATION CHECKLIST

### For Each Component:
- [ ] Create HTML/CSS version in `apps/web` or `apps/admin`
- [ ] Create React component in `packages/ui`
- [ ] Create mobile equivalent in `mobile/components`
- [ ] Add TypeScript types
- [ ] Add prop validation
- [ ] Support light/dark mode
- [ ] Make responsive (mobile, tablet, desktop)
- [ ] Add accessibility attributes (ARIA)
- [ ] Write unit tests (100% coverage)
- [ ] Document usage with examples
- [ ] Add to Storybook (optional)

---

## 📚 USAGE EXAMPLES

### Dashboard Page
```tsx
// apps/web/src/app/dashboard/page.tsx
import { StatCard, TrendStatCard, ProgressStatCard } from '@lms/ui';

export default function DashboardPage() {
  return (
    <div className="container-fluid">
      <div className="row g-3">
        <div className="col-12 col-md-6 col-lg-3">
          <StatCard 
            icon={<i className="icon-users" />}
            value="1,234"
            label="Total Users"
            variant="primary"
          />
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <TrendStatCard 
            icon={<i className="icon-trending-up" />}
            value="$4,673"
            label="Revenue"
            trend={25.2}
            trendLabel="vs last month"
          />
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <ProgressStatCard 
            label="Course Completion"
            value={78}
            variant="success"
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 🔗 RESOURCES

- **Vuexy HTML Demo:** https://demos.pixinvent.com/vuexy-html-admin-template/
- **Bootstrap 5 Docs:** https://getbootstrap.com/docs/5.3/
- **Vuexy Next.js:** https://demos.pixinvent.com/vuexy-nextjs-admin-template/
- **Icon Library:** Feather Icons (https://feathericons.com/)

---

**Document Version:** 1.0  
**Last Updated:** February 27, 2026  
**Maintainer:** Engineering Team
