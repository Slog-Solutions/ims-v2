import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.model.js';
import Item from '../models/Item.model.js';
import StockLedger from '../models/StockLedger.model.js';
import Voucher from '../models/Voucher.model.js';
import Condemnation from '../models/Condemnation.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import ActivityLog from '../models/ActivityLog.model.js';
import EquipmentSet from '../models/EquipmentSet.model.js';
import PhysicalStoreItem from '../models/PhysicalStoreItem.model.js';
import Task from '../models/Task.model.js';
import logger from '../utils/logger.js';
import { USER_ROLES, ITEM_UNITS } from '../utils/constants.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    logger.info('Database connected for seeding EQPT INFO & MGMT SYS...');

    // Clear existing collections
    await User.deleteMany({});
    await Item.deleteMany({});
    await StockLedger.deleteMany({});
    await Voucher.deleteMany({});
    await Condemnation.deleteMany({});
    await RefreshToken.deleteMany({});
    await ActivityLog.deleteMany({});
    await EquipmentSet.deleteMany({});
    await PhysicalStoreItem.deleteMany({});
    await Task.deleteMany({});
    logger.info('Cleared all collections.');

    // 1. Seed Master User (HQ Commander)
    const masterUser = await User.create({
      email: 'master@beg.centre',
      password: 'Password@123',
      firstName: 'HQ Engineer',
      lastName: 'Commander Roorkee',
      phone: '9876543210',
      role: USER_ROLES.MASTER,
      designation: 'Chief Engineer',
      serviceNumber: 'IC-48291X',
      isEmailVerified: true,
      isPhoneVerified: true,
    });
    logger.info('Master (HQ Commander) seeded.');

    // 2. Seed 10 Establishments
    const units = [
      { email: 'est1@beg.centre', name: 'Training Battalion I', designation: 'OIC Stores', serviceNumber: 'IC-51001A', lat: 29.8700, lng: 77.8950 },
      { email: 'est2@beg.centre', name: 'Training Battalion II', designation: 'OIC Stores', serviceNumber: 'IC-51002B', lat: 29.8650, lng: 77.9000 },
      { email: 'est3@beg.centre', name: 'Training Battalion III', designation: 'OIC Stores', serviceNumber: 'IC-51003C', lat: 29.8600, lng: 77.8920 },
      { email: 'est4@beg.centre', name: 'Depot Company', designation: 'Quartermaster Officer', serviceNumber: 'IC-51004D', lat: 29.8720, lng: 77.8880 },
      { email: 'est5@beg.centre', name: 'HQ Wing', designation: 'Adjutant Stores', serviceNumber: 'IC-51005E', lat: 29.8680, lng: 77.8800 },
      { email: 'est6@beg.centre', name: 'Boys Company', designation: 'OIC Stores', serviceNumber: 'IC-51006F', lat: 29.8550, lng: 77.8900 },
      { email: 'est7@beg.centre', name: 'Specialist Training Unit', designation: 'OIC Technical Stores', serviceNumber: 'IC-51007G', lat: 29.8780, lng: 77.9120 },
      { email: 'est8@beg.centre', name: 'Bridging Train Wing', designation: 'Stores In-charge', serviceNumber: 'IC-51008H', lat: 29.8620, lng: 77.9080 },
      { email: 'est9@beg.centre', name: 'E&M Training Wing', designation: 'OIC Stores', serviceNumber: 'IC-51009K', lat: 29.8660, lng: 77.8880 },
      { email: 'est10@beg.centre', name: 'Model Room Depot', designation: 'Curator & Stores OIC', serviceNumber: 'IC-51010L', lat: 29.8520, lng: 77.8760 },
    ];

    const seededUnits = [];
    for (const unit of units) {
      const u = await User.create({
        email: unit.email,
        password: 'Password@123',
        firstName: 'Unit Officer',
        lastName: unit.name,
        phone: '9000000000',
        role: USER_ROLES.ESTABLISHMENT,
        establishmentName: unit.name,
        designation: unit.designation,
        serviceNumber: unit.serviceNumber,
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      seededUnits.push({ user: u, lat: unit.lat, lng: unit.lng });
    }
    logger.info('10 Establishment accounts seeded.');

    // 3. Seed Nomenclature Items
    const itemsData = [
      { nomenclature: 'Sapper Shovel Mk.IV', unitOfIssue: ITEM_UNITS.NOS, ledgerFolio: 'LF/ENG/102', description: 'Heavy-duty steel combat shovel', minStockLevel: 50 },
      { nomenclature: 'Pneumatic Drill Bit 22mm', unitOfIssue: ITEM_UNITS.NOS, ledgerFolio: 'LF/TECH/408', description: 'Hardened carbide drill bit for concrete operations', minStockLevel: 10 },
      { nomenclature: 'Camouflage Netting 10x10m', unitOfIssue: ITEM_UNITS.NOS, ledgerFolio: 'LF/GEN/045', description: 'Synthetic fire-retardant multi-spectral camouflage nets', minStockLevel: 15 },
      { nomenclature: 'Assault Rope Nylon 50m', unitOfIssue: ITEM_UNITS.MTRS, ledgerFolio: 'LF/TRAIN/89', description: '12mm dynamic climbing/assault nylon rope', minStockLevel: 200 },
      { nomenclature: 'Combat Helmet Ballistic', unitOfIssue: ITEM_UNITS.NOS, ledgerFolio: 'LF/ORD/301', description: 'Kevlar advanced combat helmet (ACH)', minStockLevel: 100 },
      { nomenclature: 'Barbed Wire Concertina Coil', unitOfIssue: ITEM_UNITS.NOS, ledgerFolio: 'LF/DEF/209', description: 'High-tensile steel concertina razor wire', minStockLevel: 30 },
      { nomenclature: 'NBC Decontamination Kit', unitOfIssue: ITEM_UNITS.SET, ledgerFolio: 'LF/CHEM/512', description: 'Individual NBC decontamination equipment pack', minStockLevel: 5 },
      { nomenclature: 'Water Purification Tablets', unitOfIssue: ITEM_UNITS.BOX, ledgerFolio: 'LF/MED/782', description: 'Chlorine-based purification tablets (1000 per box)', minStockLevel: 25 },
    ];

    const seededItems = [];
    for (const item of itemsData) {
      const it = await Item.create(item);
      seededItems.push(it);
    }
    logger.info('Nomenclature items seeded.');

    // 4. Seed Equipment Sets (Templates)
    const setTemplates = [
      {
        name: 'Bridging Set Mk.I',
        description: 'Standard equipment package for rapid assault bridge launching and construction.',
        items: [
          { item: seededItems[0]._id, requiredQuantity: 15 }, // Sapper Shovel
          { item: seededItems[3]._id, requiredQuantity: 100 }, // Nylon Rope (MTRS)
          { item: seededItems[4]._id, requiredQuantity: 10 }, // Combat Helmet
          { item: seededItems[1]._id, requiredQuantity: 5 }, // Drill Bit
        ]
      },
      {
        name: 'Mine Clearance Set Alpha',
        description: 'Essential gear for locating, flagging, and clearing antipersonnel and antitank mines.',
        items: [
          { item: seededItems[0]._id, requiredQuantity: 20 }, // Sapper Shovel
          { item: seededItems[4]._id, requiredQuantity: 15 }, // Combat Helmet
          { item: seededItems[2]._id, requiredQuantity: 8 }, // Camouflage Netting
        ]
      },
      {
        name: 'NBC Decontamination Set',
        description: 'Chemical, biological and radiological safety set for personnel and vehicle cleaning.',
        items: [
          { item: seededItems[6]._id, requiredQuantity: 10 }, // NBC Decon Kit
          { item: seededItems[7]._id, requiredQuantity: 5 }, // Water Purifier
          { item: seededItems[4]._id, requiredQuantity: 5 }, // Combat Helmet
        ]
      }
    ];

    const seededSets = [];
    for (const setT of setTemplates) {
      const s = await EquipmentSet.create(setT);
      seededSets.push(s);
    }
    logger.info('Equipment Sets seeded.');

    // 5. Seed PhysicalStoreItem instances for RFID, Vintage, and Maintenance Tracking
    logger.info('Generating physical items with unique serials, RFID tags, and service history...');
    let snCount = 1000;
    
    // We will generate about 15-20 physical store items for EACH nomenclature item at EACH unit
    // This allows for individual tracking.
    const serviceabilityTypes = ['serviceable', 'serviceable', 'serviceable', 'under_repair', 'unserviceable'];
    const serviceTypes = ['routine', 'repair', 'overhaul'];

    for (const unitInfo of seededUnits) {
      const unit = unitInfo.user;
      
      // Stock ledger entries
      for (const item of seededItems) {
        // Create 8 physical items of this type for this unit
        const countToCreate = Math.floor(Math.random() * 8) + 12; // 12 to 19 items
        
        for (let i = 0; i < countToCreate; i++) {
          snCount++;
          const itemCode = item.nomenclature.split(' ').map(w => w[0]).join('').toUpperCase();
          const serialNumber = `SN-${itemCode}-${snCount}`;
          const rfidTag = `RFID-${itemCode}-${snCount}`;
          
          // Random year from 2012 to 2026 (vintage)
          const procurementYear = Math.floor(Math.random() * 15) + 2012;
          
          // Serviceability distributions: mostly serviceable
          const serviceability = serviceabilityTypes[Math.floor(Math.random() * serviceabilityTypes.length)];
          
          // Status: mostly stored, some deployed
          const status = Math.random() > 0.85 ? 'deployed' : 'stored';
          
          // Slight coordinates variance around the unit base
          const latOffset = (Math.random() - 0.5) * 0.004;
          const lngOffset = (Math.random() - 0.5) * 0.004;
          const lat = unitInfo.lat + latOffset;
          const lng = unitInfo.lng + lngOffset;

          // Generate some maintenance logs
          const maintenanceHistory = [];
          const numServices = Math.floor(Math.random() * 3);
          for (let sIdx = 0; sIdx < numServices; sIdx++) {
            const serviceYear = procurementYear + Math.floor(Math.random() * (2026 - procurementYear));
            if (serviceYear <= 2026) {
              maintenanceHistory.push({
                serviceDate: new Date(serviceYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
                description: `Completed periodic service and checks. Recalibrated components.`,
                cost: Math.floor(Math.random() * 500) + 100,
                servicedBy: 'EME Workshops Roorkee',
                nextServiceDueDate: new Date(2026, 12, 31)
              });
            }
          }

          // Generate defects if unserviceable or under repair
          const defects = [];
          if (serviceability === 'unserviceable' || serviceability === 'under_repair') {
            defects.push({
              defectDescription: serviceability === 'unserviceable' 
                ? 'Severe damage to structural base/casing. Requires workshop overhaul.' 
                : 'Defective sensor calibration. Scheduled for repair.',
              reportedDate: new Date(2026, 7, 10),
              severity: serviceability === 'unserviceable' ? 'critical' : 'medium',
              status: serviceability === 'unserviceable' ? 'open' : 'in_progress',
            });
          }

          // Randomly associate some items to an equipment set instance
          let associatedSet = null;
          if (Math.random() > 0.5) {
            // Find sets that contain this nomenclature item
            const matchingSets = seededSets.filter(s => s.items.some(it => it.item.toString() === item._id.toString()));
            if (matchingSets.length > 0) {
              associatedSet = matchingSets[Math.floor(Math.random() * matchingSets.length)]._id;
            }
          }

          await PhysicalStoreItem.create({
            item: item._id,
            serialNumber,
            rfidTag,
            equipmentSet: associatedSet,
            establishment: unit._id,
            procurementYear,
            serviceability,
            status,
            location: {
              name: status === 'deployed' ? `${unit.establishmentName} Deployed Field Site` : `${unit.establishmentName} Depot`,
              coordinates: { lat, lng }
            },
            defects,
            maintenanceHistory,
            nextServiceDate: new Date(2026, 9 + Math.floor(Math.random() * 3), 15),
          });
        }

        // Add a bulk stock ledger entry reflecting the totals for compatibility with the voucher/ledger tracking system
        await StockLedger.create({
          item: item._id,
          establishment: unit._id,
          openingBalance: 0,
          quantity: countToCreate,
          closingBalance: countToCreate,
          transactionType: 'seeding',
          remarks: 'Initial stock ledger seeding for individual tracking matching physical items.',
        });
      }
    }
    logger.info('Physical items and stock ledgers seeded.');

    // 6. Seed a default task planned by HQ
    const bridgingSet = seededSets[0];
    const taskUnit = seededUnits[0].user; // Training Battalion I
    
    // Find some physical items from Training Battalion I to allocate
    const itemsToAllocate = await PhysicalStoreItem.find({ 
      establishment: taskUnit._id,
      serviceability: 'serviceable' 
    }).limit(6);

    const defaultTask = await Task.create({
      name: 'Bridge Launching Drill - Solani River',
      description: 'Tactical deployment and launching exercises of Bridging Set Mk.I for sap engineering recruits.',
      requiredEquipmentSet: bridgingSet._id,
      assignedEstablishment: taskUnit._id,
      status: 'active',
      startDate: new Date(2026, 7, 20),
      endDate: new Date(2026, 8, 10),
      allocatedItems: itemsToAllocate.map(i => i._id)
    });

    // Update those physical items to task_assigned status
    for (const allocatedItem of itemsToAllocate) {
      allocatedItem.status = 'task_assigned';
      allocatedItem.location = {
        name: 'Solani River Crossing Site Alpha',
        coordinates: { lat: 29.8950, lng: 77.9250 }
      };
      await allocatedItem.save();
    }

    logger.info('Default Combat Engineer task and allocations seeded successfully.');
    logger.info('Database seeding completed successfully! 🎉');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
