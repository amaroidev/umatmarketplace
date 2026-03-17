import { Router } from 'express';
import {
  toggleSavedItem,
  getSavedItems,
  isSaved,
  getSavedItemIds,
} from '../controllers/savedItem.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All saved item routes require authentication
router.use(authenticate);

// GET /api/saved — get saved products
router.get('/', getSavedItems);

// GET /api/saved/ids — get saved product IDs
router.get('/ids', getSavedItemIds);

// GET /api/saved/:productId/is-saved — check if product is saved
router.get('/:productId/is-saved', isSaved);

// POST /api/saved/:productId — toggle save/unsave
router.post('/:productId', toggleSavedItem);

export default router;
