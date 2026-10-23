// Exports every tenant and bill to an Excel workbook written to stdout.
// Usage: MONGO_URI=... node scripts/export-excel.js > rent-records.xlsx
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const Tenant = require('../models/Tenant');

const NPR = '"NPR "#,##0';
const monthDate = (month) => new Date(`1 ${month}`);

function addSheet(workbook, name, columns, rows) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = columns;
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return sheet;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const tenants = await Tenant.find().sort({ createdAt: 1 }).lean();

  const bills = tenants
    .flatMap((t) =>
      t.billHistory.map((b) => ({
        month: b.month,
        tenant: t.name,
        room: t.roomNumber,
        rent: b.rent,
        waterBill: b.waterBill,
        wastageBill: b.wastageBill,
        previousUnit: b.previousUnit,
        currentUnit: b.currentUnit,
        consumedUnits: b.consumedUnits,
        electricityBill: b.electricityBill,
        totalBill: b.totalBill,
        generatedAt: b.generatedAt,
      }))
    )
    .sort((a, b) => monthDate(a.month) - monthDate(b.month) || a.room.localeCompare(b.room, undefined, { numeric: true }));

  const summary = new Map();
  for (const b of bills) {
    const row = summary.get(b.month) || { month: b.month, tenants: 0, rent: 0, waterBill: 0, wastageBill: 0, electricityBill: 0, totalBill: 0 };
    row.tenants += 1;
    for (const key of ['rent', 'waterBill', 'wastageBill', 'electricityBill', 'totalBill']) row[key] += b[key];
    summary.set(b.month, row);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Rent Calculator';
  workbook.created = new Date();

  // One column per billed month, so each tenant row reads like a ledger
  const months = [...summary.keys()];
  const tenantRows = tenants.map((t) => ({
    ...t,
    ...Object.fromEntries(t.billHistory.map((b) => [b.month, b.totalBill])),
    bills: t.billHistory.length,
    totalBilled: t.billHistory.reduce((sum, b) => sum + b.totalBill, 0),
    status: t.deletedAt ? 'Deleted' : 'Active',
  }));

  const tenantSheet = addSheet(workbook, 'Tenants', [
    { header: 'Name', key: 'name', width: 24 },
    { header: 'Room', key: 'roomNumber', width: 8 },
    { header: 'WhatsApp', key: 'phone', width: 20 },
    { header: 'Rent', key: 'rent', width: 14, style: { numFmt: NPR } },
    { header: 'Water', key: 'waterBill', width: 12, style: { numFmt: NPR } },
    { header: 'Wastage', key: 'wastageBill', width: 12, style: { numFmt: NPR } },
    { header: 'Last reading (kWh)', key: 'previousUnit', width: 20 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Added', key: 'createdAt', width: 12, style: { numFmt: 'yyyy-mm-dd' } },
    ...months.map((m) => ({ header: m, key: m, width: 16, style: { numFmt: NPR } })),
    { header: 'Bills', key: 'bills', width: 8 },
    { header: 'Total billed', key: 'totalBilled', width: 16, style: { numFmt: NPR } },
  ], tenantRows);

  const totals = tenantSheet.addRow({
    name: 'Total',
    ...Object.fromEntries(months.map((m) => [m, summary.get(m).totalBill])),
    bills: bills.length,
    totalBilled: bills.reduce((sum, b) => sum + b.totalBill, 0),
  });
  totals.font = { bold: true };
  totals.border = { top: { style: 'thin' } };

  addSheet(workbook, 'Bills', [
    { header: 'Month', key: 'month', width: 16 },
    { header: 'Tenant', key: 'tenant', width: 24 },
    { header: 'Room', key: 'room', width: 10 },
    { header: 'Rent', key: 'rent', width: 14, style: { numFmt: NPR } },
    { header: 'Water', key: 'waterBill', width: 12, style: { numFmt: NPR } },
    { header: 'Wastage', key: 'wastageBill', width: 12, style: { numFmt: NPR } },
    { header: 'Previous (kWh)', key: 'previousUnit', width: 15 },
    { header: 'Current (kWh)', key: 'currentUnit', width: 15 },
    { header: 'Units', key: 'consumedUnits', width: 8 },
    { header: 'Electricity', key: 'electricityBill', width: 14, style: { numFmt: NPR } },
    { header: 'Total', key: 'totalBill', width: 14, style: { numFmt: NPR } },
    { header: 'Saved on', key: 'generatedAt', width: 12, style: { numFmt: 'yyyy-mm-dd' } },
  ], bills);

  addSheet(workbook, 'Monthly summary', [
    { header: 'Month', key: 'month', width: 16 },
    { header: 'Tenants billed', key: 'tenants', width: 15 },
    { header: 'Rent', key: 'rent', width: 14, style: { numFmt: NPR } },
    { header: 'Water', key: 'waterBill', width: 12, style: { numFmt: NPR } },
    { header: 'Wastage', key: 'wastageBill', width: 12, style: { numFmt: NPR } },
    { header: 'Electricity', key: 'electricityBill', width: 14, style: { numFmt: NPR } },
    { header: 'Total', key: 'totalBill', width: 16, style: { numFmt: NPR } },
  ], [...summary.values()]);

  process.stdout.write(Buffer.from(await workbook.xlsx.writeBuffer()));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
