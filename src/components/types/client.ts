export type SocialPlatform = "instagram" | "facebook" | "linkedin" | "tiktok" | "twitter" | "youtube";

export interface SocialNetwork {
  platform: SocialPlatform;
  username: string;
}

export interface PublicationSchedule {
  day: string;
  time: string;
}

export interface ClientInfo {
  generalInfo: string;
  meetings: Array<{
    date: string;
    notes: string;
  }>;
  socialNetworks: SocialNetwork[];
  branding?: string;
  publicationSchedule: PublicationSchedule[];
}

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
  clientInfo?: ClientInfo;
}