export interface ApiParam {
  name: string;
  type: string;
  requirement: 'Required' | 'Optional' | 'Path' | 'Query';
  description: string;
}

export interface ApiErrorResponse {
  status: number;
  description: string;
}

export interface ApiEndpointDoc {
  id: string;
  group: 'Wallet' | 'Sender IDs' | 'Messages';
  method: string;
  path: string;
  summary: string;
  description: string;
  requestParams?: ApiParam[];
  responseParams: ApiParam[];
  requestBody?: string;
  status: number;
  response: string;
  errors: ApiErrorResponse[];
}

export const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
};

export function endpointKey(e: Pick<ApiEndpointDoc, 'method' | 'path'>) {
  return `${e.method} ${e.path}`;
}

export function statusBadgeVariant(status: number): 'success' | 'destructive' {
  return status < 400 ? 'success' : 'destructive';
}

export const API_ENDPOINTS: ApiEndpointDoc[] = [
  {
    id: 'wallet-balance',
    group: 'Wallet',
    method: 'GET',
    path: '/v1/wallet/balance',
    summary: 'Get wallet balance',
    description: 'Returns the organization’s current SMS credit balance. Rate limited to 100 requests / 15 minutes per organization.',
    responseParams: [{ name: 'creditsBalance', type: 'integer', requirement: 'Optional', description: 'Current SMS credit balance.' }],
    status: 200,
    response: `{
  "creditsBalance": 1240
}`,
    errors: [
      { status: 401, description: 'Invalid or missing API key.' },
      { status: 403, description: 'This account has been suspended.' },
      { status: 429, description: 'Rate limit exceeded.' },
    ],
  },
  {
    id: 'wallet-topup',
    group: 'Wallet',
    method: 'POST',
    path: '/v1/wallet/topup',
    summary: 'Start a wallet top-up',
    description:
      'Starts a credit purchase and returns the fields needed to present a Paystack checkout to your user. If Paystack isn’t configured (e.g. a sandbox environment), credits are applied immediately and `mode` is `"stub"` instead.',
    requestParams: [{ name: 'ghs', type: 'number', requirement: 'Required', description: 'Must match an active Package.ghs value.' }],
    responseParams: [
      { name: 'mode', type: 'string', requirement: 'Optional', description: '"checkout" or "stub".' },
      { name: 'reference', type: 'string', requirement: 'Optional', description: 'Transaction reference to key the checkout/webhook/verify flow off of.' },
      { name: 'amountGHS', type: 'number', requirement: 'Optional', description: 'Amount to charge, in GHS.' },
      { name: 'email', type: 'string', requirement: 'Optional', description: 'Payer email to prefill at checkout.' },
      { name: 'organizationId', type: 'string', requirement: 'Optional', description: 'Your organization’s ID.' },
      { name: 'packageGhs', type: 'number', requirement: 'Optional', description: 'Selected package amount, in GHS.' },
      { name: 'subaccountCode', type: 'string', requirement: 'Optional', description: 'Paystack subaccount code, if configured.' },
    ],
    requestBody: `{
  "ghs": 50
}`,
    status: 200,
    response: `{
  "mode": "checkout",
  "reference": "FLK-3f9b6a2e-8f1a-4c9d-9e2a-8b6b7a5b2b10",
  "amountGHS": 50,
  "email": "admin@stpaulschurch.org",
  "organizationId": "665f1c2e9b1d4a0012a3f8c7",
  "packageGhs": 50,
  "subaccountCode": "ACCT_8f4s02q6kd6xn2p"
}`,
    errors: [
      { status: 401, description: 'Invalid or missing API key.' },
      { status: 422, description: 'Choose a valid credit package.' },
    ],
  },
  {
    id: 'sender-ids-list',
    group: 'Sender IDs',
    method: 'GET',
    path: '/v1/sender-ids',
    summary: 'List sender IDs',
    description: 'Lists every sender ID registered on your organization and its approval status.',
    responseParams: [
      { name: 'id', type: 'string', requirement: 'Optional', description: 'Sender ID record ID.' },
      { name: 'senderId', type: 'string', requirement: 'Optional', description: 'The registered sender name.' },
      { name: 'status', type: 'string', requirement: 'Optional', description: 'One of pending_review, pending_bms, approved, rejected.' },
      { name: 'isPrimary', type: 'boolean', requirement: 'Optional', description: 'Whether this is the default sender ID for sends.' },
      { name: 'purpose', type: 'string', requirement: 'Optional', description: 'Free-text note on what this sender ID is used for.' },
    ],
    status: 200,
    response: `[
  {
    "id": "665f1c2e9b1d4a0012a3f8d1",
    "senderId": "StPaulsChurch",
    "status": "approved",
    "isPrimary": true,
    "purpose": "General church announcements"
  },
  {
    "id": "665f1c2e9b1d4a0012a3f8d2",
    "senderId": "STPAULEVENTS",
    "status": "pending_review",
    "isPrimary": false,
    "purpose": "Event reminders"
  }
]`,
    errors: [{ status: 401, description: 'Invalid or missing API key.' }],
  },
  {
    id: 'sender-ids-create',
    group: 'Sender IDs',
    method: 'POST',
    path: '/v1/sender-ids',
    summary: 'Register a new sender ID',
    description: 'Registers a new sender ID. It’s created in "pending_review" status — an admin must approve it before it can be used to send.',
    requestParams: [
      { name: 'senderId', type: 'string', requirement: 'Required', description: '3–11 characters.' },
      { name: 'purpose', type: 'string', requirement: 'Optional', description: 'What this sender ID will be used for.' },
    ],
    responseParams: [
      { name: 'id', type: 'string', requirement: 'Optional', description: 'Sender ID record ID.' },
      { name: 'senderId', type: 'string', requirement: 'Optional', description: 'The registered sender name.' },
      { name: 'status', type: 'string', requirement: 'Optional', description: 'Always "pending_review" on creation.' },
      { name: 'isPrimary', type: 'boolean', requirement: 'Optional', description: 'True if this is the organization’s first sender ID.' },
      { name: 'purpose', type: 'string', requirement: 'Optional', description: 'Echoes the submitted purpose.' },
    ],
    requestBody: `{
  "senderId": "StPaulsChurch",
  "purpose": "General church announcements"
}`,
    status: 201,
    response: `{
  "id": "665f1c2e9b1d4a0012a3f8d1",
  "senderId": "StPaulsChurch",
  "status": "pending_review",
  "isPrimary": true,
  "purpose": "General church announcements"
}`,
    errors: [
      { status: 401, description: 'Invalid or missing API key.' },
      { status: 422, description: 'senderId is required.' },
    ],
  },
  {
    id: 'sender-ids-delete',
    group: 'Sender IDs',
    method: 'DELETE',
    path: '/v1/sender-ids/{id}',
    summary: 'Delete a sender ID',
    description:
      'Removes a sender ID. An approved sender ID cannot be removed. If the removed ID was primary, the next remaining one becomes primary.',
    requestParams: [{ name: 'id', type: 'string', requirement: 'Path', description: 'The sender ID record’s ID (from the list/create response).' }],
    responseParams: [
      { name: 'id', type: 'string', requirement: 'Optional', description: 'Organization ID.' },
      { name: 'creditsBalance', type: 'integer', requirement: 'Optional', description: 'Current SMS credit balance.' },
      { name: 'senderIds', type: 'array', requirement: 'Optional', description: 'Remaining sender IDs after the removal.' },
    ],
    status: 200,
    response: `{
  "id": "665f1c2e9b1d4a0012a3f8c7",
  "churchName": "St. Paul's Church",
  "creditsBalance": 1240,
  "senderIds": [
    {
      "id": "665f1c2e9b1d4a0012a3f8d2",
      "senderId": "STPAULEVENTS",
      "status": "pending_review",
      "isPrimary": true,
      "purpose": "Event reminders"
    }
  ]
}`,
    errors: [
      { status: 401, description: 'Invalid or missing API key.' },
      { status: 404, description: 'Sender ID not found.' },
      { status: 422, description: 'An approved sender ID cannot be removed.' },
    ],
  },
  {
    id: 'sender-ids-status',
    group: 'Sender IDs',
    method: 'GET',
    path: '/v1/sender-ids/status',
    summary: 'Check live sender ID status',
    description: 'Checks a sender ID’s live registration status directly with the SMS provider (BMS Africa). The response shape is passed through as-is from the provider.',
    requestParams: [{ name: 'senderId', type: 'string', requirement: 'Query', description: 'The sender ID to check.' }],
    responseParams: [{ name: '(passthrough)', type: 'object', requirement: 'Optional', description: 'Provider-defined shape — not guaranteed to be stable.' }],
    status: 200,
    response: `{
  "status": "success",
  "senderId": "StPaulsChurch",
  "bmsStatus": "approved"
}`,
    errors: [
      { status: 401, description: 'Invalid or missing API key.' },
      { status: 422, description: 'senderId is required.' },
    ],
  },
  {
    id: 'messages-send',
    group: 'Messages',
    method: 'POST',
    path: '/v1/messages/send',
    summary: 'Send a message immediately',
    description:
      'Sends an SMS to a phone number, group, or your full contact list. Debits wallet credits (segments × recipient count) and dispatches via the configured SMS provider.',
    requestParams: [
      { name: 'body', type: 'string', requirement: 'Required', description: 'Message text.' },
      { name: 'recipientType', type: 'string', requirement: 'Optional', description: '"groups" (default), "all", or "single".' },
      { name: 'groupIds', type: 'string[]', requirement: 'Optional', description: 'Required when recipientType is "groups".' },
      { name: 'phone', type: 'string', requirement: 'Optional', description: 'Required when recipientType is "single".' },
      { name: 'recipientName', type: 'string', requirement: 'Optional', description: 'Label used when recipientType is "single".' },
      { name: 'templateId', type: 'string', requirement: 'Optional', description: 'Template this send was composed from.' },
      { name: 'senderId', type: 'string', requirement: 'Optional', description: 'Defaults to the organization’s primary approved sender ID.' },
    ],
    responseParams: [
      { name: 'id', type: 'string', requirement: 'Optional', description: 'The created message’s ID.' },
      { name: 'stats', type: 'object', requirement: 'Optional', description: 'total / delivered / failed / pending counts.' },
      { name: 'creditCost', type: 'integer', requirement: 'Optional', description: 'Credits debited for this send.' },
      { name: 'creditsBalance', type: 'integer', requirement: 'Optional', description: 'Remaining balance after this send.' },
    ],
    requestBody: `{
  "body": "Service starts at 9am this Sunday!",
  "recipientType": "groups",
  "groupIds": ["665f1c2e9b1d4a0012a3f8e1"]
}`,
    status: 201,
    response: `{
  "id": "665f1c2e9b1d4a0012a3f8f0",
  "stats": { "total": 128, "delivered": 0, "failed": 0, "pending": 128 },
  "creditCost": 128,
  "creditsBalance": 1112
}`,
    errors: [
      { status: 401, description: 'Invalid or missing API key.' },
      { status: 402, description: 'Not enough wallet credits for this send.' },
      { status: 422, description: 'Missing message body, an unsupported recipientType, or an empty group/contact list.' },
    ],
  },
];
