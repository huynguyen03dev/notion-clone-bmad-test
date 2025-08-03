import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, loginSchema, registerSchema } from '../auth-utils';

describe('Authentication Integration', () => {
  describe('Password Security', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword('wrongpassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should validate login credentials', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      expect(() => loginSchema.parse(validLogin)).not.toThrow();
      
      const invalidLogin = {
        email: 'invalid-email',
        password: '123'
      };
      
      expect(() => loginSchema.parse(invalidLogin)).toThrow();
    });

    it('should validate registration data', () => {
      const validRegistration = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      
      expect(() => registerSchema.parse(validRegistration)).not.toThrow();
      
      const invalidRegistration = {
        name: 'J',
        email: 'invalid-email',
        password: '123'
      };
      
      expect(() => registerSchema.parse(invalidRegistration)).toThrow();
    });
  });

  describe('Authentication Flow', () => {
    it('should have correct schema structure', () => {
      const loginData = loginSchema.parse({
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(loginData).toEqual({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should have correct registration structure', () => {
      const registerData = registerSchema.parse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(registerData).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
