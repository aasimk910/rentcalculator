const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const { calculateBill } = require('../billing');

// Deleted tenants are kept with a deletedAt date and hidden everywhere else
const findActiveTenant = (id) => Tenant.findOne({ _id: id, deletedAt: null });

// GET all tenants
router.get('/', async (req, res) => {
  try {
    const tenants = await Tenant.find({ deletedAt: null }).sort({ createdAt: -1 });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single tenant
router.get('/:id', async (req, res) => {
  try {
    const tenant = await findActiveTenant(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create tenant
router.post('/', async (req, res) => {
  const { name, roomNumber, phone, rent, waterBill, wastageBill, currentUnit } = req.body;
  // previousUnit is set manually in DB by the landlord; default to currentUnit if not provided
  const previousUnit = req.body.previousUnit !== undefined ? req.body.previousUnit : currentUnit;

  const tenant = new Tenant({ name, roomNumber, phone: phone || '', rent, waterBill, wastageBill, previousUnit, currentUnit });

  try {
    const saved = await tenant.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update tenant
router.put('/:id', async (req, res) => {
  const { name, roomNumber, phone, rent, waterBill, wastageBill, previousUnit, currentUnit } = req.body;

  try {
    const existing = await findActiveTenant(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Tenant not found' });

    const nextPreviousUnit = previousUnit !== undefined ? previousUnit : existing.previousUnit;

    if (nextPreviousUnit < 0) {
      return res.status(400).json({ message: 'Previous unit must be >= 0' });
    }

    if (currentUnit < nextPreviousUnit) {
      return res.status(400).json({ message: `Current unit must be >= previous unit (${nextPreviousUnit})` });
    }

    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { name, roomNumber, phone: phone || '', rent, waterBill, wastageBill, previousUnit: nextPreviousUnit, currentUnit },
      { new: true, runValidators: true }
    );
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE tenant (hides it; can be undone with POST /:id/restore)
router.delete('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ message: 'Tenant deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST restore a deleted tenant
router.post('/:id/restore', async (req, res) => {
  try {
    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true }
    );
    if (!tenant) return res.status(404).json({ message: 'Deleted tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST save bill to history
router.post('/:id/generate-bill', async (req, res) => {
  try {
    const tenant = await findActiveTenant(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const { month, currentUnit } = req.body;
    if (!month) return res.status(400).json({ message: 'Month is required' });

    // Prevent duplicate bill for the same month
    const alreadySaved = tenant.billHistory.some((b) => b.month === month);
    if (alreadySaved) {
      return res.status(400).json({ message: `Bill for ${month} has already been saved.` });
    }

    // Allow passing currentUnit directly (from quick-bill modal)
    if (currentUnit !== undefined) {
      if (currentUnit < tenant.previousUnit) {
        return res.status(400).json({ message: `Current unit must be >= previous unit (${tenant.previousUnit})` });
      }
      tenant.currentUnit = currentUnit;
    }

    const { consumedUnits, electricityBill, totalBill } = calculateBill(tenant);

    tenant.billHistory.push({
      month,
      rent: tenant.rent,
      waterBill: tenant.waterBill,
      wastageBill: tenant.wastageBill,
      previousUnit: tenant.previousUnit,
      currentUnit: tenant.currentUnit,
      consumedUnits,
      electricityBill,
      totalBill,
    });

    // Roll over: current month's reading becomes next month's previous reading
    tenant.previousUnit = tenant.currentUnit;

    await tenant.save();
    res.json({ message: 'Bill saved to history', tenant, billHistory: tenant.billHistory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH correct meter readings for a specific historical bill
router.patch('/:id/bills/:billId', async (req, res) => {
  try {
    const tenant = await findActiveTenant(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const bill = tenant.billHistory.id(req.params.billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const { previousUnit, currentUnit } = req.body;

    if (previousUnit !== undefined) bill.previousUnit = Number(previousUnit);
    if (currentUnit !== undefined) bill.currentUnit = Number(currentUnit);

    if (bill.currentUnit < bill.previousUnit) {
      return res.status(400).json({ message: 'Current unit must be >= previous unit' });
    }

    Object.assign(bill, calculateBill(bill));

    await tenant.save();
    res.json({ message: 'Bill corrected', tenant });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET monthly history for a specific tenant
router.get('/:id/monthly-history', async (req, res) => {
  try {
    const tenant = await findActiveTenant(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const billHistory = tenant.billHistory
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
      .map((bill) => ({
        _id: bill._id,
        month: bill.month,
        rent: bill.rent,
        waterBill: bill.waterBill,
        wastageBill: bill.wastageBill,
        electricityBill: bill.electricityBill,
        totalBill: bill.totalBill,
        previousUnit: bill.previousUnit,
        currentUnit: bill.currentUnit,
        consumedUnits: bill.consumedUnits,
        generatedAt: bill.generatedAt,
      }));

    const totalCollected = billHistory.reduce((sum, bill) => sum + bill.totalBill, 0);
    const avgMonthly = billHistory.length > 0 ? totalCollected / billHistory.length : 0;

    res.json({
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        roomNumber: tenant.roomNumber,
      },
      summary: {
        totalMonths: billHistory.length,
        totalCollected,
        averageMonthly: Math.round(avgMonthly),
      },
      history: billHistory,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET monthly summary for all tenants
router.get('/summary/all-months', async (req, res) => {
  try {
    const tenants = await Tenant.find({ deletedAt: null }).select('name roomNumber billHistory');
    
    const allMonthsSummary = tenants.map((tenant) => ({
      tenantId: tenant._id,
      name: tenant.name,
      roomNumber: tenant.roomNumber,
      totalMonths: tenant.billHistory.length,
      totalCollected: tenant.billHistory.reduce((sum, bill) => sum + bill.totalBill, 0),
      lastBillMonth: tenant.billHistory.length > 0 
        ? tenant.billHistory[tenant.billHistory.length - 1].month 
        : 'N/A',
    }));

    const grandTotal = allMonthsSummary.reduce((sum, t) => sum + t.totalCollected, 0);
    const totalMonthsRecorded = allMonthsSummary.reduce((sum, t) => sum + t.totalMonths, 0);

    res.json({
      summary: {
        totalTenants: allMonthsSummary.length,
        totalMonthsRecorded,
        grandTotalCollected: grandTotal,
      },
      tenantsSummary: allMonthsSummary,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
