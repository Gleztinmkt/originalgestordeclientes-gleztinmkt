import { Clock, Package, CreditCard, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";

export interface Client {
  id: string;
  name: string;
  package: string;
  nextPayment: string;
  marketingInfo: string;
}

interface ClientListProps {
  clients: Client[];
  onDeleteClient: (id: string) => void;
}

export const ClientList = ({ clients, onDeleteClient }: ClientListProps) => {
  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {clients.map((client) => (
        <Card
          key={client.id}
          className="animate-fade-in hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-heading">
              {client.name}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteClient(client.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Package className="h-4 w-4 mr-1" />
                {client.package}
              </Badge>
              <Badge variant="outline" className="ml-2">
                <CreditCard className="h-4 w-4 mr-1" />
                Próximo pago: {client.nextPayment}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{client.marketingInfo}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};