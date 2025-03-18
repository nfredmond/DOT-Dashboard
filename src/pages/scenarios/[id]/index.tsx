import Link from "next/link";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

const ScenarioPage = (props) => {
  // Assuming scenario is available in the component's context
  const scenario = { id: "example-scenario" };
  const pathname = "/scenarios/example-scenario";

  return (
    <div>
      {/* ... existing code ... */}

      <ul className="flex flex-col space-y-1">
        {/* ... existing links ... */}
        <li>
          <Link
            href={`/scenarios/${scenario.id}/activity-simulation`}
            className={cn(
              "text-sm px-3 py-2 rounded-md flex items-center",
              "hover:bg-secondary transition-colors duration-200",
              pathname.includes('activity-simulation') ? "bg-secondary text-primary font-medium" : "text-muted-foreground"
            )}
          >
            <Activity className="w-4 h-4 mr-2" />
            <span>Activity Simulation</span>
          </Link>
        </li>
        {/* ... existing code ... */}
      </ul>

      {/* ... existing code ... */}
    </div>
  );
};

export default ScenarioPage; 