import { Clock, Package, CreditCard, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
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
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      {clients.map((client) => (
        <Card
          key={client.id}
          className="glass-card hover:shadow-lg transition-all duration-300"
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-heading font-semibold text-gray-800">
              {client.name}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteClient(client.id)}
              className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-black text-white border-0 rounded-lg px-3 py-1">
                <Package className="h-4 w-4 mr-1" />
                {client.package}
              </Badge>
              <Badge variant="outline" className="bg-white/50 backdrop-blur-sm text-gray-700 rounded-lg px-3 py-1">
                <CreditCard className="h-4 w-4 mr-1" />
                {client.nextPayment}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{client.marketingInfo}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};