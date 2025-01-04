import { Client } from "@/components/ClientList";

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
  return {
    name: client.name || '',
    phone: client.phone || null,
    payment_day: client.paymentDay ? parseInt(client.paymentDay.toString()) : null,
    marketing_info: client.marketingInfo || null,
    instagram: client.instagram || null,
    facebook: client.facebook || null,
    packages: JSON.stringify(client.packages || [])
  };
};

export const formatDatabaseClient = (dbClient: any): Client => {
  return {
    id: dbClient.id,
    name: dbClient.name,
    phone: dbClient.phone || "",
    paymentDay: dbClient.payment_day || 1,
    marketingInfo: dbClient.marketing_info || "",
    instagram: dbClient.instagram || "",
    facebook: dbClient.facebook || "",
    packages: parsePackages(dbClient.packages)
  };
};