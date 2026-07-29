export {};

interface ContactInfo {
  name?: string[];
  tel?: string[];
  email?: string[];
  address?: unknown[];
  icon?: Blob[];
}

interface ContactsSelectOptions {
  multiple?: boolean;
}

interface ContactsManager {
  select(properties: string[], options?: ContactsSelectOptions): Promise<ContactInfo[]>;
  getProperties(): Promise<string[]>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }

  interface Window {
    ContactsManager?: unknown;
  }
}
