const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tenants', require('./routes/tenants'));

app.get('/', (req, res) => {
  res.json({ message: 'Rent Calculator API is running' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    
    // Setup monthly auto-save cron job
    // Runs at 11:55 PM on the last day of every month
    cron.schedule('55 23 28-31 * *', async () => {
      const now = new Date();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      if (now.getDate() === lastDayOfMonth.getDate()) {
        try {
          const autoSaveResult = await autoSaveMonthlyBills();
          console.log(`[CRON] Auto-saved bills:`, autoSaveResult);
        } catch (err) {
          console.error('[CRON] Error auto-saving bills:', err.message);
        }
      }
    });
    
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Auto-save monthly bills function
async function autoSaveMonthlyBills() {
  const Tenant = require('./models/Tenant');
  const ELECTRICITY_RATE = 11;
  
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const tenants = await Tenant.find();
  let savedCount = 0;
  let skippedCount = 0;
  
  for (const tenant of tenants) {
    // Check if bill already exists for this month
    const billExists = tenant.billHistory.some((b) => b.month === monthName);
    
    if (billExists) {
      skippedCount++;
      continue;
    }
    
    try {
      const consumed = tenant.currentUnit - tenant.previousUnit;
      const electricityBill = consumed * ELECTRICITY_RATE;
      const totalBill = tenant.rent + tenant.waterBill + tenant.wastageBill + electricityBill;
      
      tenant.billHistory.push({
        month: monthName,
        rent: tenant.rent,
        waterBill: tenant.waterBill,
        wastageBill: tenant.wastageBill,
        previousUnit: tenant.previousUnit,
        currentUnit: tenant.currentUnit,
        consumedUnits: consumed,
        electricityBill,
        totalBill,
      });
      
      // Roll over for next month
      tenant.previousUnit = tenant.currentUnit;
      await tenant.save();
      savedCount++;
    } catch (err) {
      console.error(`Error saving bill for tenant ${tenant.name}:`, err.message);
    }
  }
  
  return { savedCount, skippedCount, month: monthName };
}
