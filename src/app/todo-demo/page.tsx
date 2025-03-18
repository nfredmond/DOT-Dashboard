"use client";

import React, { useState } from 'react';
import { ProjectTodoList, TodoList, TodoItem } from '@/components/ui/Todo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ListTodo, Sparkles, Info } from 'lucide-react';

export default function TodoDemoPage() {
  // Sample Todo data for the standalone demo
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: "demo1",
      title: "Review project scope",
      description: "Ensure all requirements are captured",
      status: "completed",
      priority: "high",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: "demo2",
      title: "Update timeline",
      status: "in-progress",
      priority: "medium",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: "demo3",
      title: "Connect with stakeholders",
      description: "Schedule a meeting with key stakeholders",
      status: "todo",
      priority: "low",
      createdAt: new Date().toISOString()
    }
  ]);

  // Handlers for the standalone demo
  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id 
        ? { ...todo, status: todo.status === "completed" ? "todo" : "completed" } 
        : todo
    ));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleAddTodo = (title: string) => {
    const newTodo: TodoItem = {
      id: `demo-${Date.now()}`,
      title,
      status: "todo",
      priority: "medium",
      createdAt: new Date().toISOString()
    };
    setTodos([newTodo, ...todos]);
  };

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Todo Components</h1>
          <p className="text-muted-foreground">Task management tools for transportation projects</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Documentation
        </Button>
      </div>

      <Tabs defaultValue="standalone" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="standalone">
            <ListTodo className="h-4 w-4 mr-2" />
            Standalone Todo
          </TabsTrigger>
          <TabsTrigger value="project">
            <Sparkles className="h-4 w-4 mr-2" />
            Project Integration
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="standalone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Standalone Todo Component</CardTitle>
              <CardDescription>
                Basic todo list component that can be used anywhere in the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TodoList
                todos={todos}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
                onAddTodo={handleAddTodo}
                title="Project Planning Tasks"
                description="Tasks for the planning phase of the project"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Usage Examples</CardTitle>
              <CardDescription>
                Different ways to implement the Todo component
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Basic Implementation</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm">
                  {`import { TodoList, TodoItem } from '@/components/ui/Todo';

// State management
const [todos, setTodos] = useState<TodoItem[]>([]);

// Event handlers
const handleToggle = (id) => { /* ... */ };
const handleDelete = (id) => { /* ... */ };
const handleAdd = (title) => { /* ... */ };

// Render component
<TodoList
  todos={todos}
  onToggle={handleToggle}
  onDelete={handleDelete}
  onAddTodo={handleAdd}
  title="My Tasks"
/>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="project" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Integration</CardTitle>
              <CardDescription>
                Todo list integrated with project data and API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectTodoList projectId="demo-project-1" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Implementation Details</CardTitle>
              <CardDescription>
                How to integrate with project data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Project Integration</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm">
                  {`import { ProjectTodoList } from '@/components/ui/Todo';

// Just provide the project ID
<ProjectTodoList projectId="your-project-id" />`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 