import { Client } from "@/components/types/client";

export const parsePackages = (packagesData: any) => {
  if (!packagesData) return [];
  try {
    const packages = typeof packagesData === 'string' ? JSON.parse(packagesData) : packagesData;
    return Array.isArray(packages) ? packages.map(pkg => ({
      id: pkg.id || crypto.randomUUID(),
      name: pkg.name || "",
      totalPublications: parseInt(pkg.totalPublications) || 0,
      usedPublications: parseInt(pkg.usedPublications) || 0,
      month: pkg.month || "",
      paid: Boolean(pkg.paid)
    })) : [];
  } catch (error) {
    console.error('Error parsing packages:', error);
    return [];
  }
};

export const formatClientForDatabase = (client: Partial<Client>) => {
  console.log('Formatting client for database:', client);
  const formatted = {
    name: client.name || '',
    phone: client.phone || null,
    payment_day: client.paymentDay ? parseInt(client.paymentDay.toString()) : null,
    marketing_info: client.marketingInfo || null,
    instagram: client.instagram || null,
    facebook: client.facebook || null,
    packages: client.packages ? JSON.stringify(client.packages) : null,
    client_info: client.clientInfo || null
  };
  console.log('Formatted client:', formatted);
  return formatted;
};

export const formatDatabaseClient = (dbClient: any): Client => {
  console.log('Formatting database client:', dbClient);
  const formatted = {
    id: dbClient.id,
    name: dbClient.name,
    phone: dbClient.phone || "",
    paymentDay: dbClient.payment_day || 1,
    marketingInfo: dbClient.marketing_info || "",
    instagram: dbClient.instagram || "",
    facebook: dbClient.facebook || "",
    packages: parsePackages(dbClient.packages),
    clientInfo: dbClient.client_info || {
      generalInfo: "",
      meetings: [],
      socialNetworks: []
    }
  };
  console.log('Formatted client:', formatted);
  return formatted;
};