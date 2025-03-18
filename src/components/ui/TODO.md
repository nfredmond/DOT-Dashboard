# Todo Component

A flexible, reusable Todo component for managing tasks and to-do items in the Planning Manager application.

## Features

- Todo items with title, description, priority, and status
- Support for due dates and assignees
- Visual indicators for priority levels
- Grouping of active and completed tasks
- Project-specific task loading from API
- Optimistic updates for better UX
- Filtering and categorization of tasks

## Components

The Todo module consists of several components:

### `TodoItem`

Renders an individual todo item with interactive elements for toggling completion and deletion.

```tsx
<TodoItem
  todo={todoItem}
  onToggle={(id) => handleToggle(id)}
  onDelete={(id) => handleDelete(id)}
/>
```

### `TodoList`

Renders a list of todo items with a form to add new todos.

```tsx
<TodoList
  todos={todos}
  onToggle={handleToggle}
  onDelete={handleDelete}
  onAddTodo={handleAddTodo}
  title="Project Tasks"
  description="Tasks for the current sprint"
/>
```

### `ProjectTodoList`

Connects to the API to fetch and manage todos for a specific project.

```tsx
<ProjectTodoList projectId="project-123" />
```

## Integration with Projects

The Todo component is integrated with the project management system, allowing tasks to be associated with specific projects. Use the `ProjectTodoList` component to automatically fetch and manage todos for a project.

### API Integration

The component interacts with the following API endpoints:

- `GET /api/projects/[id]/tasks` - Fetch tasks for a project
- `POST /api/projects/[id]/tasks` - Create a new task
- `PATCH /api/projects/[id]/tasks/[taskId]` - Update a task
- `DELETE /api/projects/[id]/tasks/[taskId]` - Delete a task

## Type Definitions

```typescript
export type TodoPriority = "low" | "medium" | "high";
export type TodoStatus = "todo" | "in-progress" | "completed";

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string;
  assignedTo?: {
    id: string;
    email: string;
    profileImage?: string;
  };
  createdAt: string;
  createdBy?: string;
}
```

## Usage Examples

### Basic Usage

```tsx
import { TodoList, TodoItem } from '@/components/ui/Todo';
import { useState } from 'react';

export function TaskManager() {
  const [todos, setTodos] = useState([
    {
      id: '1',
      title: 'Complete documentation',
      status: 'todo',
      priority: 'high',
      createdAt: new Date().toISOString()
    }
  ]);
  
  const handleToggle = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id 
        ? { ...todo, status: todo.status === 'completed' ? 'todo' : 'completed' } 
        : todo
    ));
  };
  
  const handleDelete = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
  
  const handleAddTodo = (title) => {
    const newTodo = {
      id: `todo-${Date.now()}`,
      title,
      status: 'todo',
      priority: 'medium',
      createdAt: new Date().toISOString()
    };
    setTodos([newTodo, ...todos]);
  };
  
  return (
    <TodoList
      todos={todos}
      onToggle={handleToggle}
      onDelete={handleDelete}
      onAddTodo={handleAddTodo}
      title="Task Manager"
    />
  );
}
```

### Project Integration

```tsx
import { ProjectTodoList } from '@/components/ui/Todo';

export function ProjectDetailPage({ projectId }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        {/* Project details */}
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">Project Tasks</h3>
        <ProjectTodoList projectId={projectId} />
      </div>
    </div>
  );
}
```

## Customization

The Todo component uses Tailwind CSS for styling and can be customized by modifying the class names or wrapping the components with additional styling.

### Custom Styling Example

```tsx
<div className="p-4 bg-blue-50 rounded-lg">
  <TodoList
    todos={todos}
    onToggle={handleToggle}
    onDelete={handleDelete}
    onAddTodo={handleAddTodo}
    title="Custom Todo List"
    className="bg-white rounded p-4 shadow"
  />
</div>
``` 