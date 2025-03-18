"use client";

import * as React from "react";
import { Check, Plus, Trash2, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

interface TodoItemProps {
  todo: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const isCompleted = todo.status === "completed";
  
  return (
    <div 
      className={cn(
        "group flex items-start gap-2 rounded-md border p-3 transition-colors",
        isCompleted 
          ? "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20" 
          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900/50"
      )}
    >
      <div 
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
          isCompleted 
            ? "border-green-500 bg-green-500/10 text-green-600 dark:border-green-700 dark:bg-green-700/20 dark:text-green-400" 
            : "border-gray-300 dark:border-gray-700"
        )}
        onClick={() => onToggle(todo.id)}
        role="checkbox"
        aria-checked={isCompleted}
        tabIndex={0}
      >
        {isCompleted && <Check className="h-3.5 w-3.5" />}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 
            className={cn(
              "text-sm font-medium",
              isCompleted && "text-gray-500 line-through dark:text-gray-400"
            )}
          >
            {todo.title}
          </h4>
          <Badge 
            variant={
              todo.priority === "high" 
                ? "destructive" 
                : todo.priority === "medium" 
                  ? "default" 
                  : "outline"
            }
            className="text-xs"
          >
            {todo.priority}
          </Badge>
        </div>
        
        {todo.description && (
          <p 
            className={cn(
              "text-xs text-gray-600 dark:text-gray-400", 
              isCompleted && "text-gray-400 line-through dark:text-gray-500"
            )}
          >
            {todo.description}
          </p>
        )}
        
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {todo.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {todo.assignedTo && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{todo.assignedTo.email}</span>
            </div>
          )}
        </div>
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(todo.id)}
      >
        <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  );
}

interface TodoListProps {
  todos: TodoItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTodo: (title: string) => void;
  title?: string;
  description?: string;
  className?: string;
}

export function TodoList({
  todos,
  onToggle,
  onDelete,
  onAddTodo,
  title = "Todo List",
  description,
  className,
}: TodoListProps) {
  const [newTodoTitle, setNewTodoTitle] = React.useState("");
  
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoTitle.trim()) {
      onAddTodo(newTodoTitle.trim());
      setNewTodoTitle("");
    }
  };
  
  // Group todos by status
  const activeTodos = todos.filter(todo => todo.status !== "completed");
  const completedTodos = todos.filter(todo => todo.status === "completed");
  
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      )}
      
      <form onSubmit={handleAddTodo} className="flex gap-2">
        <Input
          type="text"
          placeholder="Add a new todo..."
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add Todo</span>
        </Button>
      </form>
      
      <div className="space-y-2">
        {activeTodos.length > 0 ? (
          activeTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))
        ) : (
          <p className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
            No active todos. Add one to get started!
          </p>
        )}
      </div>
      
      {completedTodos.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Completed ({completedTodos.length})
          </h4>
          <div className="space-y-2">
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectTodoList({
  projectId,
  className,
}: {
  projectId: string;
  className?: string;
}) {
  const [todos, setTodos] = React.useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Fetch todos for the project
  React.useEffect(() => {
    const fetchTodos = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would be an API call
        // const response = await fetch(`/api/projects/${projectId}/tasks`);
        // if (!response.ok) throw new Error('Failed to fetch tasks');
        // const data = await response.json();
        // setTodos(data.data);
        
        // For demo purposes, we'll use mock data
        setTimeout(() => {
          setTodos([
            {
              id: "1",
              title: "Complete environmental assessment",
              description: "Finish the draft environmental assessment documentation",
              status: "in-progress",
              priority: "high",
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString()
            },
            {
              id: "2",
              title: "Stakeholder meeting",
              status: "todo",
              priority: "medium",
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString()
            },
            {
              id: "3",
              title: "Submit funding application",
              status: "completed",
              priority: "high",
              createdAt: new Date().toISOString()
            }
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError("Failed to load tasks");
        setIsLoading(false);
        console.error(err);
      }
    };
    
    fetchTodos();
  }, [projectId]);
  
  const handleToggleTodo = async (id: string) => {
    // Find the todo
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    // Toggle status
    const newStatus: TodoStatus = 
      todo.status === "completed" ? "todo" : "completed";
    
    // In a real implementation, this would be an API call
    // await fetch(`/api/projects/${projectId}/tasks/${id}`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ status: newStatus })
    // });
    
    // Update local state
    setTodos(todos.map(t => 
      t.id === id ? { ...t, status: newStatus } : t
    ));
  };
  
  const handleDeleteTodo = async (id: string) => {
    // In a real implementation, this would be an API call
    // await fetch(`/api/projects/${projectId}/tasks/${id}`, {
    //   method: 'DELETE'
    // });
    
    // Update local state
    setTodos(todos.filter(t => t.id !== id));
  };
  
  const handleAddTodo = async (title: string) => {
    // Create new todo object
    const newTodo: TodoItem = {
      id: `temp-${Date.now()}`, // Temporary ID, would be replaced by server
      title,
      status: "todo",
      priority: "medium",
      createdAt: new Date().toISOString()
    };
    
    // Optimistically update UI
    setTodos([newTodo, ...todos]);
    
    // In a real implementation, this would be an API call
    // const response = await fetch(`/api/projects/${projectId}/tasks`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ title })
    // });
    // const data = await response.json();
    
    // Update with real server data
    // setTodos(todos => 
    //   todos.map(t => t.id === newTodo.id ? { ...data.data } : t)
    // );
  };
  
  if (isLoading) {
    return (
      <div className={cn("flex justify-center items-center py-8", className)}>
        <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={cn("py-6 text-center", className)}>
        <p className="text-red-500">{error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
      </div>
    );
  }
  
  return (
    <TodoList
      title="Project Tasks"
      description="Manage tasks for this project"
      todos={todos}
      onToggle={handleToggleTodo}
      onDelete={handleDeleteTodo}
      onAddTodo={handleAddTodo}
      className={className}
    />
  );
} 