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
  "status": "success",
  "message": "Wallet balance retrieved successfully.",
  "data": {
    "creditsBalance": 1240
  }
}`,
    errors: [
      { status: 401, description: 'Invalid or missing API key.' },
      { status: 403, description: 'This account has been suspended.' },
      { status: 429, description: 'Rate limit exceeded.' },
    ],
  },
  // 'wallet-topup' (/v1/wallet/topup) intentionally omitted from these docs for now -
  // SMS/wallet crediting is web-only. The route itself is untouched, just hidden here.
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
      { name: 'status', type: 'string', requirement: 'Optional', description: 'One of pending_review, processing, approved, rejected.' },
      { name: 'isPrimary', type: 'boolean', requirement: 'Optional', description: 'Whether this is the default sender ID for sends.' },
      { name: 'purpose', type: 'string', requirement: 'Optional', description: 'Free-text note on what this sender ID is used for.' },
    ],
    status: 200,
    response: `{
  "status": "success",
  "message": "Sender IDs retrieved successfully.",
  "data": [
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
  ]
}`,
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
  "status": "success",
  "message": "Sender ID created successfully.",
  "data": {
    "id": "665f1c2e9b1d4a0012a3f8d1",
    "senderId": "StPaulsChurch",
    "status": "pending_review",
    "isPrimary": true,
    "purpose": "General church announcements"
  }
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
  "status": "success",
  "message": "Sender ID deleted successfully.",
  "data": {
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
  }
}`,
    errors: [
      { status: 401, description: 'Invalid or missing API key.' },
      { status: 404, description: 'Sender ID not found.' },
      { status: 422, description: 'An approved sender ID cannot be removed.' },
    ],
  },
  {
    id: 'messages-send',
    group: 'Messages',
    method: 'POST',
    path: '/v1/messages/send',
    summary: 'Send a message immediately',
    description: 'Sends an SMS to an explicit list of recipients. Debits wallet credits (segments × recipient count) and dispatches via the configured SMS provider.',
    requestParams: [
      { name: 'recipients', type: 'object[]', requirement: 'Required', description: 'Array of { phone, name? }. Max 1000 per request. Duplicate phone numbers are deduplicated.' },
      { name: 'message', type: 'string', requirement: 'Required', description: 'Message text.' },
      { name: 'sender_id', type: 'string', requirement: 'Optional', description: 'Defaults to the organization’s primary approved sender ID.' },
    ],
    responseParams: [
      { name: 'id', type: 'string', requirement: 'Optional', description: 'The created message’s ID.' },
      { name: 'stats', type: 'object', requirement: 'Optional', description: 'total / delivered / failed / pending counts.' },
      { name: 'creditCost', type: 'integer', requirement: 'Optional', description: 'Credits debited for this send.' },
      { name: 'creditsBalance', type: 'integer', requirement: 'Optional', description: 'Remaining balance after this send.' },
    ],
    requestBody: `{
  "recipients": [
    { "phone": "+233241234567", "name": "Kwame" },
    { "phone": "+233551234567" }
  ],
  "message": "Service starts at 9am this Sunday!"
}`,
    status: 201,
    response: `{
  "status": "success",
  "message": "Message sent successfully.",
  "data": {
    "id": "665f1c2e9b1d4a0012a3f8f0",
    "stats": { "total": 2, "delivered": 0, "failed": 0, "pending": 2 },
    "creditCost": 2,
    "creditsBalance": 1112
  }
}`,
    errors: [
      { status: 401, description: 'Invalid or missing API key.' },
      { status: 402, description: 'Not enough wallet credits for this send.' },
      { status: 422, description: 'Missing message, no recipients, or an invalid recipient phone number.' },
    ],
  },
];
