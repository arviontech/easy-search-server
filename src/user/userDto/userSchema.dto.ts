import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string({ message: 'Name is required' }),
  email: z.email({ message: 'Email is required' }),
  contactNumber: z.string({ message: 'Contact number is required' }),
  password: z.string(),
});

export type CreateAdminInput = z.infer<typeof CreateUserSchema>;
