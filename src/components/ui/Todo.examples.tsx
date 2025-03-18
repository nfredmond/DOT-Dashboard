/**
 * Todo Component Examples
 * 
 * This file provides examples of how to use the Todo component in different scenarios.
 * These examples can be used as a reference when implementing the Todo component in your application.
 */

import { TodoList, TodoItem, type TodoItem as TodoItemType } from './Todo';

/**
 * Basic Todo Item example
 * 
 * This shows how to render a single todo item with all required props.
 */
export function TodoItemExample() {
  const todo: TodoItemType = {
    id: '1',
    title: 'Test Todo',
    description: 'This is a test todo item',
    status: 'todo',
    priority: 'medium',
    createdAt: new Date().toISOString()
  };
  
  return (
    <TodoItem 
      todo={todo} 
      onToggle={(id) => console.log(`Toggle todo ${id}`)} 
      onDelete={(id) => console.log(`Delete todo ${id}`)} 
    />
  );
}

/**
 * Todo List with Multiple Items
 * 
 * This example shows how to render a list of todos with varying states and priorities.
 */
export function TodoListExample() {
  const todos: TodoItemType[] = [
    {
      id: '1',
      title: 'Complete project documentation',
      description: 'Finish writing the technical documentation for the project',
      status: 'todo',
      priority: 'high',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Review pull requests',
      status: 'in-progress',
      priority: 'medium',
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Fix navigation bug',
      description: 'The navigation menu disappears on mobile screens',
      status: 'completed',
      priority: 'high',
      createdAt: new Date().toISOString()
    }
  ];
  
  return (
    <TodoList 
      todos={todos} 
      onToggle={(id) => console.log(`Toggle todo ${id}`)}
      onDelete={(id) => console.log(`Delete todo ${id}`)}
      onAddTodo={(title) => console.log(`Add new todo: ${title}`)}
      title="Development Tasks"
      description="Tasks for the current sprint"
    />
  );
}

/**
 * Project-specific Todo List
 * 
 * This example shows how to use the ProjectTodoList component which connects to the API.
 */
export function ProjectTodoListExample() {
  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-4">Project Tasks</h3>
      
      {/* In a real implementation, you would pass the actual project ID */}
      {/* <ProjectTodoList projectId="project-123" /> */}
      
      {/* For example purposes, we're just showing the code */}
      <pre className="bg-gray-100 p-3 rounded-md text-sm">
        {`import { ProjectTodoList } from '@/components/ui/Todo';

// Simply pass the project ID
<ProjectTodoList projectId="project-123" />`}
      </pre>
    </div>
  );
}

/**
 * Usage in a Project Context
 * 
 * This example shows how to integrate the Todo component within a project page.
 */
export function ProjectPageExample() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Highway 101 Expansion Project</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-4">Project Details</h3>
            <p className="text-gray-600 mb-4">
              This project involves expanding Highway 101 to reduce congestion and improve safety.
            </p>
            
            {/* Other project information */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span>In Progress</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Budget:</span>
                <span>$24,000,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Timeline:</span>
                <span>Jan 2023 - Dec 2024</span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-4">Project Tasks</h3>
            <pre className="bg-gray-100 p-3 rounded-md text-sm mb-4">
              {`<ProjectTodoList projectId={projectId} />`}
            </pre>
            <p className="text-sm text-gray-500">
              The ProjectTodoList component will fetch tasks from the API and provide functionality to add, toggle, and delete tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 