export const ELECTRICITY_RATE = 12; // NPR per unit — keep in sync with server/billing.js

// Tenants open this link, so it must be public. The self-hosted app is tailnet-only,
// so its build sets REACT_APP_QR_URL to a public copy of the image.
const QR_CODE_URL =
  process.env.REACT_APP_QR_URL ||
  `${window.location.origin}/WhatsApp%20Image%202026-04-17%20at%208.38.49%20AM.jpeg`;

export function calculateBill({ rent, waterBill, wastageBill, previousUnit, currentUnit }) {
  const consumedUnits = currentUnit - previousUnit;
  const electricityBill = consumedUnits * ELECTRICITY_RATE;
  const totalBill = rent + waterBill + wastageBill + electricityBill;
  return { consumedUnits, electricityBill, totalBill };
}

// bill: { month, rent, waterBill, wastageBill, previousUnit, currentUnit, consumedUnits, electricityBill, totalBill }
export function whatsAppUrl(tenant, bill) {
  const message =
    `*Rent Bill - ${bill.month}*\n` +
    `Tenant: ${tenant.name}\n` +
    `Room: ${tenant.roomNumber}\n` +
    `\n` +
    `Rent:         NPR ${bill.rent.toLocaleString()}\n` +
    `Water:        NPR ${bill.waterBill.toLocaleString()}\n` +
    `Wastage:      NPR ${bill.wastageBill.toLocaleString()}\n` +
    `Electricity:  NPR ${bill.electricityBill.toLocaleString()}\n` +
    `              Previous month: ${bill.previousUnit} units\n` +
    `              Current month: ${bill.currentUnit} units\n` +
    `              Consumed: ${bill.consumedUnits} units @ NPR ${ELECTRICITY_RATE}\n` +
    `─────────────────────\n` +
    `*Total: NPR ${bill.totalBill.toLocaleString()}*\n` +
    `\n💳 Scan QR to pay:\n${QR_CODE_URL}\n` +
    `\nPlease pay by the end of the month. Thank you!`;
  return `https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}
