const mongoose = require('mongoose');

const billHistorySchema = new mongoose.Schema({
  month: { type: String, required: true }, // e.g. "March 2026"
  rent: { type: Number, required: true },
  waterBill: { type: Number, required: true },
  wastageBill: { type: Number, required: true },
  previousUnit: { type: Number, required: true },
  currentUnit: { type: Number, required: true },
  consumedUnits: { type: Number, required: true },
  electricityBill: { type: Number, required: true },
  totalBill: { type: Number, required: true },
  generatedAt: { type: Date, default: Date.now },
});

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    roomNumber: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    rent: { type: Number, required: true, min: 0 },
    waterBill: { type: Number, required: true, min: 0 },
    wastageBill: { type: Number, required: true, min: 0 },
    previousUnit: { type: Number, required: true, min: 0 },
    currentUnit: { type: Number, required: true, min: 0 },
    billHistory: [billHistorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tenant', tenantSchema);
