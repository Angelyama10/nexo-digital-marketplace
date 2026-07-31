import { ServicesService } from './services.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('ServicesService', () => {
  let service: ServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesService],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  it('returns the complete catalog', () => {
    const catalog = service.findAll();

    expect(catalog).toHaveLength(6);
    expect(catalog.some((item) => item.id === 'telegram-bots')).toBe(true);
  });

  it('returns only featured services', () => {
    const featured = service.findFeatured();

    expect(featured).toHaveLength(2);
    expect(featured.every((item) => item.featured)).toBe(true);
  });
});
