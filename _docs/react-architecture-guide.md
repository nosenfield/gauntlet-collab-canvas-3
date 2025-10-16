# React SPA Modular Architecture Guide for AI Agents

## Document Purpose
This guide provides structured rules, patterns, and code examples for building scalable React Single Page Applications. Apply these principles to every React coding task.

---

## Core Architectural Principles

### RULE 1: Component-Based Architecture
**Mandate**: Break UI into independent, reusable components. Each component must encapsulate its own logic and presentation.

**Implementation**:
- Create functional components as default choice
- Use class components only when absolutely necessary (legacy code)
- One component per file
- Component file naming: PascalCase (e.g., `UserProfile.tsx`)

**Example**:
```jsx
// Good: Single responsibility, reusable
const Button = ({ onClick, children, variant = 'primary' }) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Bad: Multiple responsibilities
const UserDashboard = () => {
  // Don't mix UI, logic, and data fetching in one component
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  // ... 200 lines of mixed concerns
};
```

---

## Project Structure Patterns

### RULE 2: Feature-Driven Directory Structure
**Mandate**: Organize code by feature/domain, not by technical type.

**Standard Structure**:
```
src/
├── api/                    # API configuration and clients
│   ├── client.ts          # Axios/Fetch setup
│   └── endpoints.ts       # Centralized API routes
│
├── assets/                 # Static resources
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── components/             # Shared UI components (Atomic Design)
│   ├── atoms/             # Basic elements (Button, Input, Label)
│   ├── molecules/         # Composite elements (FormGroup, SearchBar)
│   ├── organisms/         # Complex components (Modal, Card, Navbar)
│   └── templates/         # Page layouts (Header, Footer, Sidebar)
│
├── features/              # Feature modules (self-contained)
│   ├── auth/
│   │   ├── components/   # Feature-specific components
│   │   ├── hooks/        # Feature-specific hooks
│   │   ├── api.ts        # Feature API calls
│   │   ├── authSlice.ts  # Feature state management
│   │   ├── types.ts      # Feature TypeScript types
│   │   └── index.tsx     # Feature entry point
│   │
│   └── tasks/
│       ├── components/
│       ├── hooks/
│       ├── api.ts
│       ├── tasksSlice.ts
│       └── index.tsx
│
├── hooks/                 # Global reusable hooks
│   ├── useAuth.ts
│   ├── useFetch.ts
│   └── useLocalStorage.ts
│
├── layouts/               # Layout components
│   ├── DashboardLayout.tsx
│   └── AuthLayout.tsx
│
├── services/              # Business logic services
│   ├── authService.ts
│   └── notificationService.ts
│
├── store/                 # Global state management
│   ├── index.ts          # Store configuration
│   └── rootReducer.ts    # Combined reducers
│
├── styles/                # Global styles and theme
│   ├── GlobalStyles.ts
│   ├── theme.ts
│   └── variables.css
│
├── types/                 # Global TypeScript types
│   ├── api.ts
│   └── common.ts
│
├── utils/                 # Utility functions
│   ├── dateUtils.ts
│   ├── stringUtils.ts
│   └── validators.ts
│
├── App.tsx               # Root component
└── main.tsx              # Application entry point
```

**Rationale**: Feature-based organization enables parallel development, easier maintenance, and clear separation of concerns.

---

### RULE 3: Atomic Design for Shared Components
**Mandate**: Organize reusable UI components using atomic design hierarchy.

**Hierarchy**:
1. **Atoms**: Smallest UI units (Button, Input, Label, Icon)
2. **Molecules**: Simple combinations of atoms (FormField, SearchBar)
3. **Organisms**: Complex components (Modal, Card, DataTable)
4. **Templates**: Page-level structures (PageHeader, Sidebar)

**Example**:
```jsx
// Atom: components/atoms/Button.tsx
export const Button = ({ children, variant, ...props }) => (
  <button className={`btn btn-${variant}`} {...props}>
    {children}
  </button>
);

// Molecule: components/molecules/FormField.tsx
export const FormField = ({ label, error, children }) => (
  <div className="form-field">
    <label>{label}</label>
    {children}
    {error && <span className="error">{error}</span>}
  </div>
);

// Organism: components/organisms/LoginForm.tsx
export const LoginForm = ({ onSubmit }) => (
  <form onSubmit={onSubmit}>
    <FormField label="Email" error={emailError}>
      <Input type="email" />
    </FormField>
    <FormField label="Password" error={passwordError}>
      <Input type="password" />
    </FormField>
    <Button variant="primary">Login</Button>
  </form>
);
```

---

## Component Development Rules

### RULE 4: Functional Components Only
**Mandate**: Use functional components with hooks exclusively. Avoid class components.

**Rationale**: Functional components are simpler, have better performance, and align with modern React patterns.

**Example**:
```jsx
// Correct
const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(data => {
      setUser(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return <Spinner />;
  return <div>{user.name}</div>;
};

// Avoid (legacy pattern)
class UserProfile extends React.Component {
  // Don't use class components
}
```

---

### RULE 5: Component Composition Over Configuration
**Mandate**: Prefer composing small components over complex prop configurations.

**Example**:
```jsx
// Good: Composition
const Card = ({ children }) => <div className="card">{children}</div>;
const CardHeader = ({ children }) => <div className="card-header">{children}</div>;
const CardBody = ({ children }) => <div className="card-body">{children}</div>;

// Usage
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>

// Bad: Complex props
const Card = ({ title, body, showHeader, headerColor, ... }) => {
  // Too many props, hard to maintain
};
```

---

### RULE 6: Single Responsibility Principle
**Mandate**: Each component must have one clear purpose. Maximum 200 lines per component.

**Signs of violation**:
- Component handles data fetching AND rendering AND state management
- More than 5 useState calls in one component
- Component file exceeds 200 lines

**Solution**: Extract logic into custom hooks, split into smaller components.

**Example**:
```jsx
// Bad: Multiple responsibilities
const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Data fetching logic
    fetchUser().then(/* ... */);
    fetchPosts().then(/* ... */);
  }, []);
  
  // Complex rendering logic
  return <div>{/* 150 lines of JSX */}</div>;
};

// Good: Separated concerns
const useUserDashboard = (userId) => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([fetchUser(userId), fetchPosts(userId)])
      .then(([userData, postsData]) => {
        setUser(userData);
        setPosts(postsData);
        setLoading(false);
      });
  }, [userId]);
  
  return { user, posts, loading };
};

const UserDashboard = ({ userId }) => {
  const { user, posts, loading } = useUserDashboard(userId);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      <UserHeader user={user} />
      <PostsList posts={posts} />
    </div>
  );
};
```

---

## State Management Rules

### RULE 7: State Proximity Principle
**Mandate**: Keep state as close as possible to where it's used. Only lift state up when necessary.

**Decision Tree**:
1. **Component-level state**: Used by single component → `useState`
2. **Parent-child sharing**: Used by parent and children → Lift to parent
3. **Sibling sharing**: Shared between siblings → Lift to common parent
4. **Global state**: Used across many unrelated components → Context API or Redux

**Example**:
```jsx
// Component-level state
const Counter = () => {
  const [count, setCount] = useState(0); // Only Counter needs this
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
};

// Parent-child sharing
const TodoApp = () => {
  const [todos, setTodos] = useState([]); // Parent manages, children use
  return (
    <>
      <TodoForm onAdd={(todo) => setTodos([...todos, todo])} />
      <TodoList todos={todos} />
    </>
  );
};
```

---

### RULE 8: State Management Selection
**Mandate**: Choose appropriate state management based on complexity.

**Selection Matrix**:
- **Simple app** (< 10 components): `useState` + `useContext`
- **Medium app** (10-50 components): `useReducer` + `useContext`
- **Complex app** (50+ components): Redux Toolkit or Zustand

**Example - Context API**:
```jsx
// store/AuthContext.tsx
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  const login = async (credentials) => {
    const userData = await authService.login(credentials);
    setUser(userData);
  };
  
  const logout = () => setUser(null);
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**Example - Redux Toolkit**:
```jsx
// features/tasks/tasksSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async () => {
    const response = await api.getTasks();
    return response.data;
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    status: 'idle',
    error: null
  },
  reducers: {
    taskAdded: (state, action) => {
      state.items.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const { taskAdded } = tasksSlice.actions;
export default tasksSlice.reducer;
```

---

## Custom Hooks Rules

### RULE 9: Extract Reusable Logic to Custom Hooks
**Mandate**: Any stateful logic used in multiple places must be extracted to a custom hook.

**Naming**: Always prefix with `use` (e.g., `useFetch`, `useAuth`, `useLocalStorage`)

**Example**:
```jsx
// hooks/useFetch.ts
const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

// Usage
const UserProfile = ({ userId }) => {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <div>{user.name}</div>;
};
```

**Common Custom Hooks**:
```jsx
// hooks/useLocalStorage.ts
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

// hooks/useDebounce.ts
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

---

## Data Fetching & API Integration

### RULE 10: Centralize API Configuration
**Mandate**: All API calls must go through centralized API client configuration.

**Structure**:
```jsx
// api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// api/endpoints.ts
export const API_ENDPOINTS = {
  users: {
    getAll: '/users',
    getById: (id) => `/users/${id}`,
    create: '/users',
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`
  },
  tasks: {
    getAll: '/tasks',
    create: '/tasks',
    update: (id) => `/tasks/${id}`
  }
};
```

**Feature-Specific API**:
```jsx
// features/users/api.ts
import apiClient from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';

export const userAPI = {
  getAll: () => apiClient.get(API_ENDPOINTS.users.getAll),
  getById: (id) => apiClient.get(API_ENDPOINTS.users.getById(id)),
  create: (data) => apiClient.post(API_ENDPOINTS.users.create, data),
  update: (id, data) => apiClient.put(API_ENDPOINTS.users.update(id), data),
  delete: (id) => apiClient.delete(API_ENDPOINTS.users.delete(id))
};
```

---

### RULE 11: Handle Async Operations Properly
**Mandate**: Always handle loading, error, and success states for async operations.

**Pattern**:
```jsx
const DataComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url, { 
          signal: controller.signal 
        });
        const json = await response.json();
        setData(json);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort(); // Cleanup
  }, [url]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;
  
  return <DataDisplay data={data} />;
};
```

---

## Performance Optimization Rules

### RULE 12: Prevent Unnecessary Re-renders
**Mandate**: Use memoization techniques to optimize component rendering.

**Techniques**:

**1. React.memo for Component Memoization**:
```jsx
// Expensive component that should only re-render when props change
const ExpensiveComponent = React.memo(({ data, onAction }) => {
  return (
    <div>
      {/* Complex rendering logic */}
    </div>
  );
});
```

**2. useMemo for Expensive Calculations**:
```jsx
const DataTable = ({ items, filterText }) => {
  // Only recalculate when items or filterText changes
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [items, filterText]);

  return <Table data={filteredItems} />;
};
```

**3. useCallback for Function References**:
```jsx
const ParentComponent = () => {
  const [count, setCount] = useState(0);

  // Without useCallback, new function created on each render
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []); // Dependencies array

  return <ChildComponent onClick={handleClick} />;
};
```

**4. Code Splitting with React.lazy**:
```jsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <HeavyComponent />
  </Suspense>
);
```

---

### RULE 13: Optimize List Rendering
**Mandate**: Always use keys when rendering lists. Implement virtualization for large lists.

**Key Rules**:
```jsx
// Good: Stable, unique keys
const TodoList = ({ todos }) => (
  <ul>
    {todos.map(todo => (
      <TodoItem key={todo.id} todo={todo} />
    ))}
  </ul>
);

// Bad: Index as key (causes issues with reordering)
{todos.map((todo, index) => (
  <TodoItem key={index} todo={todo} />
))}

// Bad: Non-unique keys
{todos.map(todo => (
  <TodoItem key={todo.status} todo={todo} />
))}
```

**Virtualization for Large Lists**:
```jsx
import { FixedSizeList } from 'react-window';

const LargeList = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        {items[index].name}
      </div>
    )}
  </FixedSizeList>
);
```

---

## TypeScript Integration Rules

### RULE 14: Type All Components and Props
**Mandate**: Use TypeScript for all new code. Define explicit types for all props and state.

**Component Props Typing**:
```typescript
// types/components.ts
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// Component with typed props
const Button: React.FC<ButtonProps> = ({
  variant,
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  children
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};
```

**State Typing**:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const UserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<string[]>([]);
  
  // TypeScript ensures type safety
};
```

**API Response Typing**:
```typescript
// types/api.ts
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
}

// Usage
const fetchUser = async (id: string): Promise<ApiResponse<UserResponse>> => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};
```

---

## Styling Rules

### RULE 15: CSS-in-JS or CSS Modules
**Mandate**: Use either CSS-in-JS (styled-components, Emotion) or CSS Modules. Avoid global CSS except for resets and theme.

**Option A: CSS Modules**:
```jsx
// Button.module.css
.button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.button.primary {
  background: #007bff;
  color: white;
}

// Button.tsx
import styles from './Button.module.css';

const Button = ({ variant, children }) => (
  <button className={`${styles.button} ${styles[variant]}`}>
    {children}
  </button>
);
```

**Option B: Styled Components**:
```jsx
import styled from 'styled-components';

const StyledButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background: ${props => props.variant === 'primary' ? '#007bff' : '#6c757d'};
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Button = ({ variant, children, ...props }) => (
  <StyledButton variant={variant} {...props}>
    {children}
  </StyledButton>
);
```

**Option C: Tailwind CSS**:
```jsx
// Only use Tailwind's core utility classes
const Button = ({ variant, children }) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700'
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
};
```

---

## Testing Rules

### RULE 16: Test Components and Hooks
**Mandate**: Write tests for all components, hooks, and utility functions. Minimum 80% coverage.

**Component Testing**:
```jsx
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when loading', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Hook Testing**:
```jsx
// useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter(0));
    expect(result.current.count).toBe(0);
  });

  it('increments counter', () => {
    const { result } = renderHook(() => useCounter(0));
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

---

## Error Handling Rules

### RULE 17: Implement Error Boundaries
**Mandate**: Wrap component trees with error boundaries to catch and handle errors gracefully.

```jsx
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
const App = () => (
  <ErrorBoundary>
    <MainApp />
  </ErrorBoundary>
);
```

---

## Routing Rules

### RULE 18: Implement Client-Side Routing
**Mandate**: Use React Router for navigation. Implement route-based code splitting.

```jsx
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load route components
const Dashboard = lazy(() => import('./features/dashboard'));
const UserProfile = lazy(() => import('./features/users/UserProfile'));
const Settings = lazy(() => import('./features/settings'));

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users/:userId" element={<UserProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
```

**Protected Routes**:
```jsx
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Usage
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

---

## Accessibility Rules

### RULE 19: Ensure WCAG 2.1 AA Compliance
**Mandate**: All components must be keyboard accessible and screen reader compatible.

**Essential Practices**:

**1. Semantic HTML**:
```jsx
// Good: Semantic elements
const Navigation = () => (
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/home">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
);

// Bad: Non-semantic divs
const Navigation = () => (
  <div className="nav">
    <div onClick={goHome}>Home</div>
    <div onClick={goAbout}>About</div>
  </div>
);
```

**2. ARIA Attributes**:
```jsx
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <h2 id="modal-title">{title}</h2>
      <div id="modal-description">{children}</div>
      <button onClick={onClose} aria-label="Close modal">
        ×
      </button>
    </div>
  );
};
```

**3. Keyboard Navigation**:
```jsx
const Dropdown = ({ options, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        onSelect(options[focusedIndex]);
        setIsOpen(false);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        Select option
      </button>
      {isOpen && (
        <ul role="listbox">
          {options.map((option, index) => (
            <li
              key={option.id}
              role="option"
              aria-selected={index === focusedIndex}
              onClick={() => onSelect(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

**4. Focus Management**:
```jsx
const Dialog = ({ isOpen, onClose, children }) => {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      dialogRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
      aria-modal="true"
    >
      {children}
    </div>
  );
};
```

---

## Form Handling Rules

### RULE 20: Controlled Components for Forms
**Mandate**: Use controlled components for form inputs. Implement proper validation.

**Basic Form Pattern**:
```jsx
const LoginForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <span id="password-error" role="alert">
            {errors.password}
          </span>
        )}
      </div>

      {errors.submit && (
        <div role="alert">{errors.submit}</div>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

**Using Form Libraries** (React Hook Form):
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const LoginForm = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email')}
        type="email"
        aria-invalid={!!errors.email}
      />
      {errors.email && <span>{errors.email.message}</span>}

      <input
        {...register('password')}
        type="password"
        aria-invalid={!!errors.password}
      />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        Login
      </button>
    </form>
  );
};
```

---

## Environment & Configuration Rules

### RULE 21: Environment Variables Management
**Mandate**: Use environment variables for all configuration. Never commit secrets.

**Setup**:
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=My App Dev
VITE_ENABLE_ANALYTICS=false

# .env.production
VITE_API_BASE_URL=https://api.production.com
VITE_APP_NAME=My App
VITE_ENABLE_ANALYTICS=true

# .env.local (gitignored - for secrets)
VITE_API_KEY=secret_key_here
```

**Usage**:
```typescript
// config/env.ts
interface Config {
  apiBaseUrl: string;
  appName: string;
  enableAnalytics: boolean;
  apiKey: string;
}

export const config: Config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  appName: import.meta.env.VITE_APP_NAME,
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  apiKey: import.meta.env.VITE_API_KEY
};

// Validate required env vars on startup
const requiredEnvVars = ['VITE_API_BASE_URL', 'VITE_API_KEY'];
requiredEnvVars.forEach(envVar => {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

---

## Code Quality Rules

### RULE 22: Linting and Formatting
**Mandate**: Configure ESLint and Prettier. All code must pass linting before commit.

**ESLint Configuration**:
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_" 
    }],
    "no-console": ["warn", { 
      "allow": ["warn", "error"] 
    }]
  }
}
```

**Prettier Configuration**:
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

---

## Security Rules

### RULE 23: Security Best Practices
**Mandate**: Implement security measures to prevent common vulnerabilities.

**1. XSS Prevention**:
```jsx
// Good: React escapes by default
const UserComment = ({ comment }) => (
  <div>{comment.text}</div>
);

// Dangerous: Only use when absolutely necessary
const RichTextContent = ({ html }) => (
  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
);

// Use DOMPurify for sanitization
import DOMPurify from 'dompurify';

const sanitizeHtml = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};
```

**2. Authentication Token Handling**:
```typescript
// utils/auth.ts
const TOKEN_KEY = 'auth_token';

export const authUtils = {
  setToken: (token: string) => {
    // Use httpOnly cookies in production
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    const token = authUtils.getToken();
    if (!token) return false;
    
    // Validate token expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
};
```

**3. Input Validation**:
```typescript
// utils/validators.ts
export const validators = {
  email: (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  password: (value: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (value.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(value)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (!/[a-z]/.test(value)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (!/[0-9]/.test(value)) {
      errors.push('Password must contain a number');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  sanitizeInput: (value: string): string => {
    return value.trim().replace(/[<>]/g, '');
  }
};
```

---

## Build & Deployment Rules

### RULE 24: Optimize Production Build
**Mandate**: Configure build optimization for production deployments.

**Vite Configuration**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }) // Bundle analysis
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material'],
        }
      }
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@features': '/src/features',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
      '@types': '/src/types'
    }
  }
});
```

---

## Documentation Rules

### RULE 25: Document Components and APIs
**Mandate**: All exported components, hooks, and utilities must have JSDoc comments.

**Component Documentation**:
```typescript
/**
 * Button component with multiple variants and sizes.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="large" onClick={handleClick}>
 *   Click Me
 * </Button>
 * ```
 */
interface ButtonProps {
  /** Visual style variant */
  variant: 'primary' | 'secondary' | 'danger';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state with spinner */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Button content */
  children: React.ReactNode;
}

/**
 * Reusable button component.
 */
export const Button: React.FC<ButtonProps> = ({
  variant,
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  children
}) => {
  // Implementation
};
```

**Hook Documentation**:
```typescript
/**
 * Custom hook for data fetching with loading and error states.
 * 
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Object containing data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data, loading, error } = useFetch('/api/users');
 * ```
 */
export const useFetch = <T = any>(
  url: string,
  options?: RequestInit
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} => {
  // Implementation
};
```

---

## Common Patterns Summary

### Pattern 1: Container/Presentational Separation
```jsx
// Container (logic)
const UserProfileContainer = ({ userId }) => {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = async (updates) => {
    await updateUser(userId, updates);
    setIsEditing(false);
  };

  if (loading) return <Spinner />;
  if (error) return <Error error={error} />;

  return (
    <UserProfileView
      user={user}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onUpdate={handleUpdate}
      onCancel={() => setIsEditing(false)}
    />
  );
};

// Presentational (UI)
const UserProfileView = ({ user, isEditing, onEdit, onUpdate, onCancel }) => (
  <div className="profile">
    {isEditing ? (
      <UserProfileForm
        user={user}
        onSubmit={onUpdate}
        onCancel={onCancel}
      />
    ) : (
      <>
        <UserInfo user={user} />
        <button onClick={onEdit}>Edit</button>
      </>
    )}
  </div>
);
```

### Pattern 2: Compound Components
```jsx
const Select = ({ children, value, onChange }) => {
  return (
    <div className="select">
      {React.Children.map(children, child =>
        React.cloneElement(child, { selected: child.props.value === value, onChange })
      )}
    </div>
  );
};

Select.Option = ({ value, selected, onChange, children }) => (
  <div
    className={selected ? 'option selected' : 'option'}
    onClick={() => onChange(value)}
  >
    {children}
  </div>
);

// Usage
<Select value={selectedValue} onChange={setSelectedValue}>
  <Select.Option value="1">Option 1</Select.Option>
  <Select.Option value="2">Option 2</Select.Option>
</Select>
```

### Pattern 3: Render Props
```jsx
const DataProvider = ({ url, children }) => {
  const { data, loading, error } = useFetch(url);
  return children({ data, loading, error });
};

// Usage
<DataProvider url="/api/users">
  {({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <Error error={error} />;
    return <UserList users={data} />;
  }}
</DataProvider>
```

### Pattern 4: Higher-Order Components
```jsx
// HOC for authentication
const withAuth = (Component) => {
  return (props) => {
    const { user, loading } = useAuth();
    
    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;
    
    return <Component {...props} user={user} />;
  };
};

// Usage
const Dashboard = withAuth(({ user }) => (
  <div>Welcome, {user.name}</div>
));
```

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Prop Drilling
```jsx
// Bad: Passing props through multiple levels
<App>
  <Dashboard user={user}>
    <Sidebar user={user}>
      <UserMenu user={user} />
    </Sidebar>
  </Dashboard>
</App>

// Good: Use Context or state management
const UserContext = createContext();

<UserContext.Provider value={user}>
  <App>
    <Dashboard>
      <Sidebar>
        <UserMenu /> {/* Access user via useContext */}
      </Sidebar>
    </Dashboard>
  </App>
</UserContext.Provider>
```

### ❌ Anti-Pattern 2: Mutating State Directly
```jsx
// Bad: Direct mutation
const addTodo = (newTodo) => {
  todos.push(newTodo); // Never mutate state directly
  setTodos(todos);
};

// Good: Create new array
const addTodo = (newTodo) => {
  setTodos([...todos, newTodo]);
};
```

### ❌ Anti-Pattern 3: Using Index as Key
```jsx
// Bad: Index as key
{items.map((item, index) => (
  <Item key={index} data={item} />
))}

// Good: Unique identifier
{items.map(item => (
  <Item key={item.id} data={item} />
))}
```

### ❌ Anti-Pattern 4: Inline Function Definitions in Render
```jsx
// Bad: New function on every render
<Button onClick={() => handleClick(id)}>Click</Button>

// Good: useCallback or stable reference
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id]);

<Button onClick={handleButtonClick}>Click</Button>
```

### ❌ Anti-Pattern 5: Not Cleaning Up Effects
```jsx
// Bad: Memory leak
useEffect(() => {
  const interval = setInterval(() => {
    // Do something
  }, 1000);
  // Missing cleanup
}, []);

// Good: Cleanup function
useEffect(() => {
  const interval = setInterval(() => {
    // Do something
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

---

## Performance Checklist

- [ ] Use React.memo for expensive components
- [ ] Implement useMemo for expensive calculations
- [ ] Use useCallback for function references passed to children
- [ ] Implement code splitting with React.lazy
- [ ] Use proper keys for list rendering
- [ ] Virtualize long lists (react-window/react-virtualized)
- [ ] Optimize images (lazy loading, proper formats)
- [ ] Debounce/throttle expensive operations
- [ ] Use production build for deployment
- [ ] Enable gzip/brotli compression
- [ ] Implement service workers for caching
- [ ] Monitor bundle size (keep under 200KB initial)

---

## Accessibility Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Proper ARIA labels and roles
- [ ] Sufficient color contrast (4.5:1 minimum)
- [ ] Focus indicators visible
- [ ] Form inputs have associated labels
- [ ] Error messages programmatically associated
- [ ] Skip navigation links provided
- [ ] Images have alt text
- [ ] Videos have captions
- [ ] Testing with screen readers

---

## Security Checklist

- [ ] Input validation on all user inputs
- [ ] Output encoding (React does by default)
- [ ] HTTPS only in production
- [ ] Secure authentication token storage
- [ ] CORS properly configured
- [ ] No sensitive data in client-side code
- [ ] Dependencies regularly updated
- [ ] Security headers configured
- [ ] CSP (Content Security Policy) implemented
- [ ] XSS prevention measures in place

---

## Final Implementation Guidelines

**When starting a new React project**:
1. Use Vite or Next.js as build tool
2. Configure TypeScript from the start
3. Set up ESLint, Prettier, and Husky
4. Implement folder structure following this guide
5. Configure path aliases for cleaner imports
6. Set up testing framework (Vitest/Jest + React Testing Library)
7. Configure CI/CD pipeline
8. Implement error boundaries at app level
9. Set up error logging/monitoring
10. Create reusable component library first

**Development workflow**:
1. Create feature branch
2. Implement component with tests
3. Run linting and type checking
4. Run test suite
5. Create pull request
6. Code review
7. Merge to main
8. Deploy to staging
9. QA testing
10. Deploy to production

**Code review checklist**:
- [ ] Follows architectural patterns
- [ ] Components properly typed
- [ ] Tests written and passing
- [ ] No console.logs or debuggers
- [ ] Accessibility requirements met
- [ ] Performance optimizations applied
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Follows naming conventions
- [ ] Code is DRY and maintainable

---

## Quick Reference: Decision Trees

### When to use useState vs useReducer?
- **useState**: 2-3 related state values, simple updates
- **useReducer**: 4+ related values, complex update logic, multiple sub-values

### When to lift state up?
- State needed by 2+ components → Lift to closest common ancestor
- State needed across distant components → Context or global state

### When to use Context vs Redux?
- **Context**: Theme, auth, simple global state
- **Redux**: Complex state, time-travel debugging, middleware needed

### When to memoize?
- Component receives same props but re-renders frequently → React.memo
- Expensive calculation with dependencies → useMemo
- Function passed to memoized child → useCallback

---

## End of Guide

Apply these principles systematically to every React coding task. When in doubt, prioritize: maintainability > performance > brevity.