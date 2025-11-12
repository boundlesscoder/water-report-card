import {
  listAccountsService,
  createAccountService,
  updateAccountService,
  getAccountService,
  deleteAccountService,
  listTier1Service,
  listTier2Service,
  listTier3Service,
  listLocationsService,
  createLocationService,
  updateLocationService,
  getLocationService,
  deleteLocationService,
  listManufacturersService,
  createManufacturerService,
  updateManufacturerService,
  deleteManufacturerService,
  listPartsService,
  createPartService,
  updatePartService,
  deletePartService,
  listAssetsService,
  createAssetService,
  updateAssetService,
  deleteAssetService,
  // buildings
  listBuildingsService,
  createBuildingService,
  updateBuildingService,
  deleteBuildingService,
  // floors
  listFloorsService,
  createFloorService,
  updateFloorService,
  deleteFloorService,
  // rooms
  listRoomsService,
  createRoomService,
  updateRoomService,
  deleteRoomService,
  // POU points
  listPOUPointsService,
  createPOUPointService,
  updatePOUPointService,
  deletePOUPointService,
  // hierarchy
  listHierarchyNodesService,
  getHierarchyNodeDetailsService,
  createHierarchyNodeService,
  updateHierarchyNodeService,
  deleteHierarchyNodeService,
  // contacts (flat view)
  listFlatContactsService
} from '../services/crm-service.js';

// =============== ACCOUNTS ==================
export async function listAccounts(req, res) {
  try {
    const data = await listAccountsService(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listAccounts error', error);
    res.status(500).json({ success: false, message: 'Failed to list accounts' });
  }
}

export async function createAccount(req, res) {
  try {
    const { name, account_number } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });
    const row = await createAccountService(req.body || {});
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error('createAccount error', error);
    res.status(500).json({ success: false, message: 'Failed to create account' });
  }
}

export async function updateAccount(req, res) {
  try {
    const { id } = req.params;
    const row = await updateAccountService(id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('updateAccount error', error);
    res.status(500).json({ success: false, message: 'Failed to update account' });
  }
}

export async function getAccount(req, res) {
  try {
    const { id } = req.params;
    const account = await getAccountService(id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, data: account });
  } catch (error) {
    console.error('getAccount error', error);
    res.status(500).json({ success: false, message: 'Failed to get account' });
  }
}

export async function deleteAccount(req, res) {
  try {
    const { id } = req.params;
    await deleteAccountService(id);
    res.status(204).end();
  } catch (error) {
    console.error('deleteAccount error', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
}

// =============== TIERS ==================
export async function listTier1(req, res) {
  try {
    const rows = await listTier1Service();
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('listTier1 error', error);
    res.status(500).json({ success: false, message: 'Failed to list tier1' });
  }
}
export async function listTier2(req, res) {
  try {
    const rows = await listTier2Service({ tier1_id: req.query.tier1_id });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('listTier2 error', error);
    res.status(500).json({ success: false, message: 'Failed to list tier2' });
  }
}
export async function listTier3(req, res) {
  try {
    const rows = await listTier3Service({ tier2_id: req.query.tier2_id });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('listTier3 error', error);
    res.status(500).json({ success: false, message: 'Failed to list tier3' });
  }
}

// =============== LOCATIONS ==================
export async function listLocations(req, res) {
  try {
    const data = await listLocationsService(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listLocations error', error);
    res.status(500).json({ success: false, message: 'Failed to list locations' });
  }
}

export async function createLocation(req, res) {
  try {
    const { account_id, name } = req.body || {};
    if (!account_id || !name) return res.status(400).json({ success: false, message: 'account_id and name are required' });
    const row = await createLocationService(req.body || {});
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error('createLocation error', error);
    res.status(500).json({ success: false, message: 'Failed to create location' });
  }
}

export async function updateLocation(req, res) {
  try {
    const { id } = req.params;
    const row = await updateLocationService(id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('updateLocation error', error);
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
}

export async function getLocation(req, res) {
  try {
    const { id } = req.params;
    const row = await getLocationService(id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('getLocation error', error);
    res.status(500).json({ success: false, message: 'Failed to get location' });
  }
}

export async function deleteLocation(req, res) {
  try {
    const { id } = req.params;
    await deleteLocationService(id);
    res.status(204).end();
  } catch (error) {
    console.error('deleteLocation error', error);
    res.status(500).json({ success: false, message: 'Failed to delete location' });
  }
}

// =============== MANUFACTURERS ==================
export async function listManufacturers(req, res) {
  try {
    const data = await listManufacturersService(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listManufacturers error', error);
    res.status(500).json({ success: false, message: 'Failed to list manufacturers' });
  }
}
export async function createManufacturer(req, res) {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });
    const row = await createManufacturerService(req.body || {});
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error('createManufacturer error', error);
    res.status(500).json({ success: false, message: 'Failed to create manufacturer' });
  }
}
export async function updateManufacturer(req, res) {
  try {
    const { id } = req.params;
    const row = await updateManufacturerService(id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('updateManufacturer error', error);
    res.status(500).json({ success: false, message: 'Failed to update manufacturer' });
  }
}
export async function deleteManufacturer(req, res) {
  try {
    const { id } = req.params;
    await deleteManufacturerService(id);
    res.status(204).end();
  } catch (error) {
    console.error('deleteManufacturer error', error);
    res.status(500).json({ success: false, message: 'Failed to delete manufacturer' });
  }
}

// =============== PARTS ==================
export async function listParts(req, res) {
  try {
    const data = await listPartsService(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listParts error', error);
    res.status(500).json({ success: false, message: 'Failed to list parts' });
  }
}
export async function createPart(req, res) {
  try {
    const { part_name } = req.body || {};
    if (!part_name) return res.status(400).json({ success: false, message: 'part_name is required' });
    const row = await createPartService(req.body || {});
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error('createPart error', error);
    res.status(500).json({ success: false, message: 'Failed to create part' });
  }
}
export async function updatePart(req, res) {
  try {
    const { id } = req.params;
    const row = await updatePartService(id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('updatePart error', error);
    res.status(500).json({ success: false, message: 'Failed to update part' });
  }
}
export async function deletePart(req, res) {
  try {
    const { id } = req.params;
    await deletePartService(id);
    res.status(204).end();
  } catch (error) {
    console.error('deletePart error', error);
    res.status(500).json({ success: false, message: 'Failed to delete part' });
  }
}

// =============== ASSETS ==================
export async function listAssets(req, res) {
  try {
    const data = await listAssetsService(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listAssets error', error);
    res.status(500).json({ success: false, message: 'Failed to list assets' });
  }
}
export async function createAsset(req, res) {
  try {
    const { part_id, account_id, location_id } = req.body || {};
    if (!part_id || !account_id || !location_id) return res.status(400).json({ success: false, message: 'part_id, account_id, location_id are required' });
    const row = await createAssetService(req.body || {});
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error('createAsset error', error);
    res.status(500).json({ success: false, message: 'Failed to create asset' });
  }
}
export async function updateAsset(req, res) {
  try {
    const { id } = req.params;
    const row = await updateAssetService(id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('updateAsset error', error);
    res.status(500).json({ success: false, message: 'Failed to update asset' });
  }
}
export async function deleteAsset(req, res) {
  try {
    const { id } = req.params;
    await deleteAssetService(id);
    res.status(204).end();
  } catch (error) {
    console.error('deleteAsset error', error);
    res.status(500).json({ success: false, message: 'Failed to delete asset' });
  }
}


// =============== BUILDINGS ==================
export async function listBuildings(req, res) {
  try {
    const data = await listBuildingsService(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listBuildings error', error);
    res.status(500).json({ success: false, message: 'Failed to list buildings' });
  }
}

export async function createBuilding(req, res) {
  try {
    const { location_id, building_name } = req.body || {};
    if (!location_id || !building_name) return res.status(400).json({ success: false, message: 'location_id and building_name are required' });
    const row = await createBuildingService(req.body || {});
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error('createBuilding error', error);
    res.status(500).json({ success: false, message: 'Failed to create building' });
  }
}

export async function updateBuilding(req, res) {
  try {
    const { id } = req.params;
    const row = await updateBuildingService(id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('updateBuilding error', error);
    res.status(500).json({ success: false, message: 'Failed to update building' });
  }
}

export async function deleteBuilding(req, res) {
  try {
    const { id } = req.params;
    await deleteBuildingService(id);
    res.status(204).end();
  } catch (error) {
    console.error('deleteBuilding error', error);
    res.status(500).json({ success: false, message: 'Failed to delete building' });
  }
}

// =============== FLOORS ==================
export async function listFloors(req, res) {
  try {
    const data = await listFloorsService(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listFloors error', error);
    res.status(500).json({ success: false, message: 'Failed to list floors' });
  }
}

export async function createFloor(req, res) {
  try {
    const { building_id } = req.body || {};
    if (!building_id) return res.status(400).json({ success: false, message: 'building_id is required' });
    const row = await createFloorService(req.body || {});
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error('createFloor error', error);
    res.status(500).json({ success: false, message: 'Failed to create floor' });
  }
}

export async function updateFloor(req, res) {
  try {
    const { id } = req.params;
    const row = await updateFloorService(id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('updateFloor error', error);
    res.status(500).json({ success: false, message: 'Failed to update floor' });
  }
}

export async function deleteFloor(req, res) {
  try {
    const { id } = req.params;
    await deleteFloorService(id);
    res.status(204).end();
  } catch (error) {
    console.error('deleteFloor error', error);
    res.status(500).json({ success: false, message: 'Failed to delete floor' });
  }
}

// =============== ROOMS ==================
export async function listRooms(req, res) {
  try {
    const data = await listRoomsService(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listRooms error', error);
    res.status(500).json({ success: false, message: 'Failed to list rooms' });
  }
}

export async function createRoom(req, res) {
  try {
    const { floor_id } = req.body || {};
    if (!floor_id) return res.status(400).json({ success: false, message: 'floor_id is required' });
    const row = await createRoomService(req.body || {});
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error('createRoom error', error);
    res.status(500).json({ success: false, message: 'Failed to create room' });
  }
}

export async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const row = await updateRoomService(id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('updateRoom error', error);
    res.status(500).json({ success: false, message: 'Failed to update room' });
  }
}

export async function deleteRoom(req, res) {
  try {
    const { id } = req.params;
    await deleteRoomService(id);
    res.status(204).end();
  } catch (error) {
    console.error('deleteRoom error', error);
    res.status(500).json({ success: false, message: 'Failed to delete room' });
  }
}

// =============== POU POINTS ==================
export async function listPOUPoints(req, res) {
  try {
    const data = await listPOUPointsService(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listPOUPoints error', error);
    res.status(500).json({ success: false, message: 'Failed to list POU points' });
  }
}

export async function createPOUPoint(req, res) {
  try {
    const { room_id, pou_id } = req.body || {};
    if (!room_id || !pou_id) return res.status(400).json({ success: false, message: 'room_id and pou_id are required' });
    const row = await createPOUPointService(req.body || {});
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error('createPOUPoint error', error);
    res.status(500).json({ success: false, message: 'Failed to create POU point' });
  }
}

export async function updatePOUPoint(req, res) {
  try {
    const { id } = req.params;
    const row = await updatePOUPointService(id, req.body || {});
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('updatePOUPoint error', error);
    res.status(500).json({ success: false, message: 'Failed to update POU point' });
  }
}

export async function deletePOUPoint(req, res) {
  try {
    const { id } = req.params;
    await deletePOUPointService(id);
    res.status(204).end();
  } catch (error) {
    console.error('deletePOUPoint error', error);
    res.status(500).json({ success: false, message: 'Failed to delete POU point' });
  }
}

// =============== HIERARCHY (Tree) ==================
export async function listHierarchyNodes(req, res) {
  try {
    const data = await listHierarchyNodesService(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listHierarchyNodes error', error);
    res.status(500).json({ success: false, message: 'Failed to list hierarchy nodes' });
  }
}

export async function getHierarchyNodeDetails(req, res) {
  try {
    const { node_type, id } = req.params;
    const allowed = new Set(['account','location','building','floor','room']);
    if (!allowed.has(node_type)) return res.status(400).json({ success: false, message: 'Invalid node_type' });
    const row = await getHierarchyNodeDetailsService({ node_type, id });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('getHierarchyNodeDetails error', error);
    res.status(500).json({ success: false, message: 'Failed to load hierarchy node details' });
  }
}

export async function createHierarchyNode(req, res) {
  try {
    const { node_type } = req.params;
    const { parent_id } = req.body || {};
    const allowed = new Set(['location','building','floor','room']);
    if (!allowed.has(node_type)) return res.status(400).json({ success: false, message: 'Unsupported node_type for creation' });
    if (!parent_id) return res.status(400).json({ success: false, message: 'parent_id is required' });
    const row = await createHierarchyNodeService({ node_type, parent_id, payload: req.body || {} });
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    console.error('createHierarchyNode error', error);
    res.status(500).json({ success: false, message: 'Failed to create hierarchy node' });
  }
}

export async function updateHierarchyNode(req, res) {
  try {
    const { node_type, id } = req.params;
    const allowed = new Set(['account','location','building','floor','room']);
    if (!allowed.has(node_type)) return res.status(400).json({ success: false, message: 'Invalid node_type' });
    const row = await updateHierarchyNodeService({ node_type, id, payload: req.body || {} });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    console.error('updateHierarchyNode error', error);
    res.status(500).json({ success: false, message: 'Failed to update hierarchy node' });
  }
}

export async function deleteHierarchyNode(req, res) {
  try {
    const { node_type, id } = req.params;
    const allowed = new Set(['account','location','building','floor','room']);
    if (!allowed.has(node_type)) return res.status(400).json({ success: false, message: 'Invalid node_type' });
    await deleteHierarchyNodeService({ node_type, id });
    res.status(204).end();
  } catch (error) {
    console.error('deleteHierarchyNode error', error);
    res.status(500).json({ success: false, message: 'Failed to delete hierarchy node' });
  }
}

// =============== CONTACTS (Flat View) ==================
export async function listFlatContacts(req, res) {
  try {
    const data = await listFlatContactsService(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    console.error('listFlatContacts error', error);
    res.status(500).json({ success: false, message: 'Failed to list contacts' });
  }
}


