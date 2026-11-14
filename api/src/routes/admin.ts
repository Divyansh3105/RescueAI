import { Router } from 'express';
import { z } from 'zod';
import { requireRole } from '../auth/middleware.js';
import { phoneField } from '../auth/phone.js';
import {
  COMMANDER_ROLES,
  createCommander,
  listCommanders,
  setCommanderActive,
} from '../services/admin.js';
import { validationFailed } from './http.js';

const createBody = z.object({
  name: z
    .string({ error: 'Enter the commander’s name.' })
    .trim()
    .min(1, 'Enter the commander’s name.')
    .max(100, 'Use at most 100 characters.'),
  phone: phoneField,
  role: z.enum(COMMANDER_ROLES, { error: 'Choose on-site or office commander.' }),
});

const patchBody = z.object({ active: z.boolean({ error: 'Say whether the account is active.' }) });

const notFound = { error: { code: 'not_found', message: 'No such commander.' } };

// Admin only (PRD Target Users, AC18).
export const adminCommandersRouter = Router();
adminCommandersRouter.use(requireRole('admin'));

adminCommandersRouter.get('/', async (_req, res) => {
  res.json({ commanders: await listCommanders() });
});

adminCommandersRouter.post('/', async (req, res) => {
  const parsed = createBody.safeParse(req.body);
  if (!parsed.success) {
    validationFailed(res, parsed.error);
    return;
  }
  const created = await createCommander(parsed.data);
  if (!created) {
    res.status(409).json({
      error: {
        code: 'phone_taken',
        message: 'That mobile number already has an account.',
        fields: { phone: 'That mobile number already has an account.' },
      },
    });
    return;
  }
  res.status(201).json(created);
});

adminCommandersRouter.patch('/:id', async (req, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(404).json(notFound);
    return;
  }
  const parsed = patchBody.safeParse(req.body);
  if (!parsed.success) {
    validationFailed(res, parsed.error);
    return;
  }
  const user = await setCommanderActive(id.data, parsed.data.active);
  if (!user) {
    res.status(404).json(notFound);
    return;
  }
  res.json({ user });
});
