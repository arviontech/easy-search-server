import z from 'zod';

export const AuthSchemaValidation = z.object({
  name: z.string({ message: "Name is required" }),
  email: z.email({ message: "Must be a valid email" }),
  contactNumber: z.string({ message: "Contact number is required" }),
  profilePhoto: z.string().optional(),
  provider: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(['HOST', 'CUSTOMER']).optional(),
});


export const LoginSchema = z.object({
  name: z.string().optional(),
  email: z.string({ message: "Email is required" }),
  contactNumber: z.string({ message: "Contact number is required" }),
  password: z.string({ message: "Password is required" }),
  provider: z.string().optional(),
});
