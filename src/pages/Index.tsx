import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

const CalendarView = lazy(() => import("@/components/calendar/CalendarView"));
const UserManagement = lazy(() => import("@/components/settings/UserManagement"));

const Index = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <div>
        <CalendarView />
        <UserManagement />
      </div>
    </Suspense>
  );
};

export default Index;
