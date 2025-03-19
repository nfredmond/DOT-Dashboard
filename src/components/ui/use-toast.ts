// Proper toast implementation
// In a real app, you might use a proper toast library like sonner or react-hot-toast

export type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

// Function to show a toast notification
export const toast = (props: ToastProps) => {
  console.log('Toast:', props);
  // In a real implementation, this would show a toast
  // This is a simplified implementation for now
}

export function useToast() {
  return { toast }
} 