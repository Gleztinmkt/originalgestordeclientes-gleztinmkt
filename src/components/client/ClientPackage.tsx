import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageCounter } from "./PackageCounter";
import { Badge } from "@/components/ui/badge";

interface ClientPackageProps {
  packageName: string;
  totalPublications: number;
  usedPublications: number;
  month: string;
  onUpdateUsed: (newCount: number) => void;
}

export const ClientPackage = ({
  packageName,
  totalPublications,
  usedPublications,
  month,
  onUpdateUsed,
}: ClientPackageProps) => {
  return (
    <Card className="bg-white/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Package className="h-5 w-5" />
          {packageName}
        </CardTitle>
        <Badge>{month}</Badge>
      </CardHeader>
      <CardContent>
        <PackageCounter
          total={totalPublications}
          used={usedPublications}
          onUpdateUsed={onUpdateUsed}
        />
      </CardContent>
    </Card>
  );
};