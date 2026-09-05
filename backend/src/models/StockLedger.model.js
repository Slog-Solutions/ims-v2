import mongoose from 'mongoose';

const stockLedgerSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  establishment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // establishment is a User account with role 'establishment'
    required: true,
  },
  openingBalance: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true, // Positive for receipts/additions, negative for issues/reductions
  },
  closingBalance: {
    type: Number,
    required: true,
    min: 0,
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['receipt', 'issue', 'condemnation', 'seeding'],
  },
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher', // Can point to a Voucher or remains null for initial seeding
  },
  remarks: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

stockLedgerSchema.index({ establishment: 1, item: 1 });
stockLedgerSchema.index({ createdAt: -1 });

const StockLedger = mongoose.model('StockLedger', stockLedgerSchema);

export default StockLedger;
