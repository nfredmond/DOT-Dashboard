import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative h-20 w-20">
            <Image 
              src="/Circle_Green_TranspRoad.png" 
              alt="RTPA Planning Manager" 
              width={80} 
              height={80} 
              className="opacity-70"
            />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        
        <p className="mb-6 text-muted-foreground">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col gap-4">
          <Button asChild>
            <Link href="/homepage">
              Return to Homepage
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/projects">
              View Projects
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 