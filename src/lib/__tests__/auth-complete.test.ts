import { describe, it, expect } from 'vitest';
import { 
  hashPassword, 
  verifyPassword, 
  loginSchema, 
  registerSchema,
  profileUpdateSchema,
  passwordResetSchema,
  passwordResetConfirmSchema
} from '../auth-utils';

describe('Complete Authentication System', () => {
  describe('Password Security', () => {
    it('should handle password hashing and verification correctly', async () => {
      const password = 'securePassword123!';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword('wrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Schema Validation', () => {
    it('should validate login schema', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'password123'
      };
      
      expect(() => loginSchema.parse(validLogin)).not.toThrow();
      
      const invalidLogin = {
        email: 'invalid-email',
        password: '123'
      };
      
      expect(() => loginSchema.parse(invalidLogin)).toThrow();
    });

    it('should validate registration schema', () => {
      const validRegistration = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      
      expect(() => registerSchema.parse(validRegistration)).not.toThrow();
    });

    it('should validate profile update schema', () => {
      const validUpdate = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };
      
      expect(() => profileUpdateSchema.parse(validUpdate)).not.toThrow();
      
      const partialUpdate = {
        name: 'Jane Doe'
      };
      
      expect(() => profileUpdateSchema.parse(partialUpdate)).not.toThrow();
    });

    it('should validate password reset schema', () => {
      const validReset = {
        email: 'user@example.com'
      };
      
      expect(() => passwordResetSchema.parse(validReset)).not.toThrow();
    });

    it('should validate password reset confirmation schema', () => {
      const validConfirm = {
        token: 'valid-token-string',
        password: 'newPassword123'
      };
      
      expect(() => passwordResetConfirmSchema.parse(validConfirm)).not.toThrow();
    });
  });

  describe('Security Requirements', () => {
    it('should enforce minimum password length', () => {
      const shortPassword = {
        email: 'user@example.com',
        password: '123'
      };
      
      expect(() => loginSchema.parse(shortPassword)).toThrow();
    });

    it('should enforce valid email format', () => {
      const invalidEmail = {
        email: 'not-an-email',
        password: 'password123'
      };
      
      expect(() => loginSchema.parse(invalidEmail)).toThrow();
    });

    it('should enforce minimum name length', () => {
      const shortName = {
        name: 'J',
        email: 'user@example.com',
        password: 'password123'
      };
      
      expect(() => registerSchema.parse(shortName)).toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should have correct TypeScript types', () => {
      const loginData = loginSchema.parse({
        email: 'test@example.com',
        password: 'password123'
      });
      
      // TypeScript should infer correct types
      expect(typeof loginData.email).toBe('string');
      expect(typeof loginData.password).toBe('string');
    });
  });
});
