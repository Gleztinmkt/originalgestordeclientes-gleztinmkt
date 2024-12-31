import { useState } from "react";
import { Clock, Package, CreditCard, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ClientPackage } from "./client/ClientPackage";
import { PaymentReminder } from "./client/PaymentReminder";
import { BulkMessageButton } from "./client/BulkMessageButton";
import { ClientFilter } from "./client/ClientFilter";

export interface Client {
  id: string;
  name: string;
  package: string;
  nextPayment: string;
  marketingInfo: string;
  phone: string;
  paymentDay: number;
  packages: Array<{
    id: string;
    name: string;
    totalPublications: number;
    usedPublications: number;
    month: string;
  }>;
}

interface ClientListProps {
  clients: Client[];
  onDeleteClient: (id: string) => void;
  onUpdatePackage: (clientId: string, packageId: string, usedPublications: number) => void;
}

export const ClientList = ({ clients, onDeleteClient, onUpdatePackage }: ClientListProps) => {
  const [selectedPaymentDay, setSelectedPaymentDay] = useState<string>("");

  const filteredClients = selectedPaymentDay
    ? clients.filter(client => client.paymentDay === parseInt(selectedPaymentDay))
    : clients;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <ClientFilter onFilterChange={setSelectedPaymentDay} />
        <BulkMessageButton 
          clients={clients}
          selectedPaymentDay={selectedPaymentDay ? parseInt(selectedPaymentDay) : undefined}
        />
      </div>

      <div className="space-y-6">
        {filteredClients.map((client) => (
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
              <PaymentReminder
                clientName={client.name}
                paymentDay={client.paymentDay}
                phone={client.phone}
              />

              {client.packages.map((pkg) => (
                <ClientPackage
                  key={pkg.id}
                  packageName={pkg.name}
                  totalPublications={pkg.totalPublications}
                  usedPublications={pkg.usedPublications}
                  month={pkg.month}
                  onUpdateUsed={(newCount) => onUpdatePackage(client.id, pkg.id, newCount)}
                />
              ))}

              <p className="text-sm text-gray-600 leading-relaxed mt-4">
                {client.marketingInfo}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};