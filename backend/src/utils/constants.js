export const USER_ROLES = {
  MASTER: 'master',
  ESTABLISHMENT: 'establishment',
};

export const VOUCHER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const VOUCHER_TYPES = {
  RECEIPT: 'receipt',
  ISSUE: 'issue',
};

export const ITEM_UNITS = {
  NOS: 'Nos',
  KGS: 'Kgs',
  MTRS: 'Mtrs',
  LTRS: 'Ltrs',
  PAIR: 'Pair',
  SET: 'Set',
  BOX: 'Box',
  DOZEN: 'Dozen',
  CRATE: 'Crate',
};

export const CONDEMNATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DISPOSED: 'disposed',
};

export const NOTIFICATION_TYPES = {
  VOUCHER: 'voucher',
  STOCK: 'stock',
  SYSTEM: 'system',
  CONDEMNATION: 'condemnation',
};

export const SOCKET_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Vouchers
  VOUCHER_CREATED: 'voucher:created',
  VOUCHER_APPROVED: 'voucher:approved',
  VOUCHER_REJECTED: 'voucher:rejected',
  
  // Ledgers
  LEDGER_UPDATED: 'ledger:updated',
  
  // Condemnations
  CONDEMNATION_CREATED: 'condemnation:created',
  CONDEMNATION_APPROVED: 'condemnation:approved',
  
  // Notifications
  NOTIFICATION: 'notification',
  
  // Room events
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',
};
