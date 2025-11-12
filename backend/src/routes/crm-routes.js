import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth-middleware.js';
import {
  // accounts
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  // tiers
  listTier1,
  listTier2,
  listTier3,
  // locations
  listLocations,
  createLocation,
  updateLocation,
  getLocation,
  deleteLocation,
  // manufacturers
  listManufacturers,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
  // parts
  listParts,
  createPart,
  updatePart,
  deletePart,
  // assets
  listAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  // buildings
  listBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  // floors
  listFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  // rooms
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  // POU
  listPOUPoints,
  createPOUPoint,
  updatePOUPoint,
  deletePOUPoint,
  // hierarchy
  listHierarchyNodes,
  getHierarchyNodeDetails,
  createHierarchyNode,
  updateHierarchyNode,
  deleteHierarchyNode,
  // contacts (flat view)
  listFlatContacts
} from '../controller/crm-controller.js';

const router = express.Router();

// Accounts
router.get('/accounts', authMiddleware, adminMiddleware, listAccounts);
router.get('/accounts/:id', authMiddleware, adminMiddleware, getAccount);
router.post('/accounts', authMiddleware, adminMiddleware, createAccount);
router.put('/accounts/:id', authMiddleware, adminMiddleware, updateAccount);
router.delete('/accounts/:id', authMiddleware, adminMiddleware, deleteAccount);

// Tiers
router.get('/tiers/tier1', authMiddleware, adminMiddleware, listTier1);
router.get('/tiers/tier2', authMiddleware, adminMiddleware, listTier2);
router.get('/tiers/tier3', authMiddleware, adminMiddleware, listTier3);

// Locations
router.get('/locations', authMiddleware, adminMiddleware, listLocations);
router.post('/locations', authMiddleware, adminMiddleware, createLocation);
router.get('/locations/:id', authMiddleware, adminMiddleware, getLocation);
router.put('/locations/:id', authMiddleware, adminMiddleware, updateLocation);
router.delete('/locations/:id', authMiddleware, adminMiddleware, deleteLocation);

// Manufacturers
router.get('/manufacturers', authMiddleware, adminMiddleware, listManufacturers);
router.post('/manufacturers', authMiddleware, adminMiddleware, createManufacturer);
router.put('/manufacturers/:id', authMiddleware, adminMiddleware, updateManufacturer);
router.delete('/manufacturers/:id', authMiddleware, adminMiddleware, deleteManufacturer);

// Parts
router.get('/parts', authMiddleware, adminMiddleware, listParts);
router.post('/parts', authMiddleware, adminMiddleware, createPart);
router.put('/parts/:id', authMiddleware, adminMiddleware, updatePart);
router.delete('/parts/:id', authMiddleware, adminMiddleware, deletePart);

// Assets
router.get('/assets', authMiddleware, adminMiddleware, listAssets);
router.post('/assets', authMiddleware, adminMiddleware, createAsset);
router.put('/assets/:id', authMiddleware, adminMiddleware, updateAsset);
router.delete('/assets/:id', authMiddleware, adminMiddleware, deleteAsset);

// Buildings
router.get('/buildings', authMiddleware, adminMiddleware, listBuildings);
router.post('/buildings', authMiddleware, adminMiddleware, createBuilding);
router.put('/buildings/:id', authMiddleware, adminMiddleware, updateBuilding);
router.delete('/buildings/:id', authMiddleware, adminMiddleware, deleteBuilding);

// Floors
router.get('/floors', authMiddleware, adminMiddleware, listFloors);
router.post('/floors', authMiddleware, adminMiddleware, createFloor);
router.put('/floors/:id', authMiddleware, adminMiddleware, updateFloor);
router.delete('/floors/:id', authMiddleware, adminMiddleware, deleteFloor);

// Rooms
router.get('/rooms', authMiddleware, adminMiddleware, listRooms);
router.post('/rooms', authMiddleware, adminMiddleware, createRoom);
router.put('/rooms/:id', authMiddleware, adminMiddleware, updateRoom);
router.delete('/rooms/:id', authMiddleware, adminMiddleware, deleteRoom);

// POU Points
router.get('/pou-points', authMiddleware, adminMiddleware, listPOUPoints);
router.post('/pou-points', authMiddleware, adminMiddleware, createPOUPoint);
router.put('/pou-points/:id', authMiddleware, adminMiddleware, updatePOUPoint);
router.delete('/pou-points/:id', authMiddleware, adminMiddleware, deletePOUPoint);

// Hierarchy Tree
router.get('/hierarchy', authMiddleware, adminMiddleware, listHierarchyNodes);
router.get('/hierarchy/:node_type/:id', authMiddleware, adminMiddleware, getHierarchyNodeDetails);
router.post('/hierarchy/:node_type', authMiddleware, adminMiddleware, createHierarchyNode);
router.put('/hierarchy/:node_type/:id', authMiddleware, adminMiddleware, updateHierarchyNode);
router.delete('/hierarchy/:node_type/:id', authMiddleware, adminMiddleware, deleteHierarchyNode);

// Contacts (Flat View)
router.get('/contacts/flat', authMiddleware, adminMiddleware, listFlatContacts);

export default router;


