const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');

const ELECTRICITY_RATE = 11; // NPR per unit

function calculateBill(tenant) {
  const consumed = tenant.currentUnit - tenant.previousUnit;
  const electricityBill = consumed * ELECTRICITY_RATE;
  const totalBill =
    tenant.rent + tenant.waterBill + tenant.wastageBill + electricityBill;
  return { consumedUnits: consumed, electricityBill, totalBill };
}

// GET all tenants
router.get('/', async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single tenant
router.get('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create tenant
router.post('/', async (req, res) => {
  const { name, roomNumber, rent, waterBill, wastageBill, currentUnit } = req.body;
  // previousUnit is set manually in DB by the landlord; default to currentUnit if not provided
  const previousUnit = req.body.previousUnit !== undefined ? req.body.previousUnit : currentUnit;

  const tenant = new Tenant({ name, roomNumber, rent, waterBill, wastageBill, previousUnit, currentUnit });

  try {
    const saved = await tenant.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update tenant
router.put('/:id', async (req, res) => {
  const { name, roomNumber, phone, rent, waterBill, wastageBill, currentUnit } = req.body;

  try {
    const existing = await Tenant.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Tenant not found' });

    if (currentUnit < existing.previousUnit) {
      return res.status(400).json({ message: `Current unit must be >= previous unit (${existing.previousUnit})` });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { name, roomNumber, phone: phone || '', rent, waterBill, wastageBill, currentUnit },
      { new: true, runValidators: true }
    );
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE tenant
router.delete('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ message: 'Tenant deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST save bill to history
router.post('/:id/generate-bill', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
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

module.exports = router;
