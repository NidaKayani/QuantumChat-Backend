import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createGroup,
  listGroups,
  getGroup,
  sendGroupMessage,
  getGroupMessages,
} from '../controllers/groupController.js';

const router = Router();

router.use(requireAuth);
router.get('/', listGroups);
router.post('/', createGroup);
router.get('/:id', getGroup);
router.get('/:groupId/messages', getGroupMessages);
router.post('/:groupId/messages', sendGroupMessage);

export default router;
