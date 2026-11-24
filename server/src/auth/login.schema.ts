import { z } from 'zod';

export const UserSchema = z.object({
    id: z.uuid({ version: "v7" }),
    email: z.email('Invalid email format'),
    password: z.string(),
    name: z.string().min(2, 'Name is required')
});

export const AuthSchema = z.object({
    email: z.email('Invalid email format'),
    password: z.string().min(3, 'Password is not long enough')
});

export type UserType = z.infer<typeof UserSchema>;

export type AuthType = z.infer<typeof AuthSchema>;

