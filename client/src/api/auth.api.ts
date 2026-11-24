import { http } from './http.ts';
import { loginResponseSchema, type LoginInput } from '../schemas/login.schema.ts';

export async function login(credentials: LoginInput) {
  const { data } = await http.post('/auth/login', credentials);
  return loginResponseSchema.parse(data);
}