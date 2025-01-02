import { useState } from "react";
import { Clock, Package, CreditCard, Trash2, Edit, Plus } from "lucide-react";
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
import { EditClientDialog } from "./client/EditClientDialog";
import { AddPackageDialog } from "./client/AddPackageDialog";

export interface Client {
  id: string;
  name: string;
  phone: string;
  paymentDay: number;
  marketingInfo: string;
  instagram?: string;
  facebook?: string;
  packages: Array<{
    id: string;
    name: string;
    totalPublications: number;
    usedPublications: number;
    month: string;
    paid: boolean;
  }>;
}

interface ClientListProps {
  clients: Client[];
  onDeleteClient: (id: string) => void;
  onUpdateClient: (id: string, data: any) => void;
  onUpdatePackage: (clientId: string, packageId: string, usedPublications: number) => void;
  onAddPackage: (clientId: string, packageData: any) => void;
}

export const ClientList = ({ 
  clients, 
  onDeleteClient, 
  onUpdateClient,
  onUpdatePackage,
  onAddPackage 
}: ClientListProps) => {
  const [selectedPaymentDay, setSelectedPaymentDay] = useState<string>("all");

  const filteredClients = selectedPaymentDay === "all"
    ? clients
    : clients.filter(client => client.paymentDay === parseInt(selectedPaymentDay));

  const handleUpdatePackagePaid = (clientId: string, packageId: string, paid: boolean) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const updatedPackages = client.packages.map(pkg => 
      pkg.id === packageId ? { ...pkg, paid } : pkg
    );

    onUpdateClient(clientId, { ...client, packages: updatedPackages });
  };

  const handleDeletePackage = (clientId: string, packageId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const updatedPackages = client.packages.filter(pkg => pkg.id !== packageId);
    onUpdateClient(clientId, { ...client, packages: updatedPackages });
  };

  const handleEditPackage = (clientId: string, packageId: string) => {
    // This will be implemented when we add package editing functionality
    console.log("Edit package", clientId, packageId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <ClientFilter onFilterChange={setSelectedPaymentDay} />
        <BulkMessageButton 
          clients={clients}
          selectedPaymentDay={selectedPaymentDay !== "all" ? parseInt(selectedPaymentDay) : undefined}
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
              <div className="flex gap-2">
                <EditClientDialog 
                  client={client}
                  onUpdateClient={onUpdateClient}
                />
                <AddPackageDialog
                  clientId={client.id}
                  onAddPackage={onAddPackage}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteClient(client.id)}
                  className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
                  paid={pkg.paid}
                  onUpdateUsed={(newCount) => onUpdatePackage(client.id, pkg.id, newCount)}
                  onUpdatePaid={(paid) => handleUpdatePackagePaid(client.id, pkg.id, paid)}
                  onEditPackage={() => handleEditPackage(client.id, pkg.id)}
                  onDeletePackage={() => handleDeletePackage(client.id, pkg.id)}
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