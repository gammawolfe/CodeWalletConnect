import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dbModule from '../../db';
import { usersRepository } from '../users-repository';

describe('UsersRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getByEmail returns undefined when no result', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://user:pass@localhost:5432/db');
    vi.spyOn(dbModule, 'db', 'get').mockReturnValue({
      select: () => ({ from: () => ({ where: async () => [] }) })
    } as any);

    const res = await usersRepository.getByEmail('none@example.com');
    expect(res).toBeUndefined();
  });
});


