const ELECTRICITY_RATE = 12; // NPR per unit — keep in sync with client/src/billing.js

function calculateBill({ rent, waterBill, wastageBill, previousUnit, currentUnit }) {
  const consumedUnits = currentUnit - previousUnit;
  const electricityBill = consumedUnits * ELECTRICITY_RATE;
  const totalBill = rent + waterBill + wastageBill + electricityBill;
  return { consumedUnits, electricityBill, totalBill };
}

module.exports = { ELECTRICITY_RATE, calculateBill };
