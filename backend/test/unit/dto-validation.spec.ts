import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from '../../src/auth/dto/register.dto';
import { CreateBotQuoteDto } from '../../src/bot-quotes/dto/create-bot-quote.dto';
import { CreateEcommerceOrderDto } from '../../src/ecommerce-orders/dto/create-ecommerce-order.dto';
import { CreateOnlineOrderDto } from '../../src/online-orders/dto/create-online-order.dto';

async function errorsFor<T extends object>(type: new () => T, input: Record<string, unknown>) {
  const value = plainToInstance(type, input);
  return validate(value, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

describe('DTO boundary validation', () => {
  it('rejects a display name made only of whitespace', async () => {
    const errors = await errorsFor(RegisterDto, {
      nombre: '   ',
      email: 'persona@example.test',
      password: 'Segura123!x',
    });

    expect(errors.some((error) => error.property === 'nombre')).toBe(true);
  });

  it('accepts a valid Unicode display name', async () => {
    const errors = await errorsFor(RegisterDto, {
      nombre: 'Ángel 李',
      email: 'unicode@example.test',
      password: 'Segura123!x',
    });

    expect(errors).toHaveLength(0);
  });

  it('does not allow the customer to submit a commission percentage', async () => {
    const errors = await errorsFor(CreateOnlineOrderDto, {
      urlProducto: 'https://shop.example.test/producto',
      montoProducto: 1000,
      porcentajeComision: 0.01,
    });

    expect(errors.some((error) => error.property === 'porcentajeComision')).toBe(true);
  });

  it('rejects an online order amount that exceeds the database range', async () => {
    const errors = await errorsFor(CreateOnlineOrderDto, {
      urlProducto: 'https://shop.example.test/producto',
      montoProducto: 100_000_000,
    });

    expect(errors.some((error) => error.property === 'montoProducto')).toBe(true);
  });

  it('rejects non-HTTP product URLs', async () => {
    const errors = await errorsFor(CreateOnlineOrderDto, {
      urlProducto: 'ftp://localhost/producto',
      montoProducto: 100,
    });

    expect(errors.some((error) => error.property === 'urlProducto')).toBe(true);
  });

  it('rejects duplicate products in one ecommerce order', async () => {
    const productId = '3d694da9-43b3-4dff-9d3c-b0d873e74400';
    const errors = await errorsFor(CreateEcommerceOrderDto, {
      items: [
        { productId, quantity: 1 },
        { productId, quantity: 1 },
      ],
    });

    expect(errors.some((error) => error.property === 'items')).toBe(true);
  });

  it('rejects oversized ecommerce carts and quantities', async () => {
    const items = Array.from({ length: 101 }, (_, index) => ({
      productId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      quantity: index === 0 ? 1_000_000 : 1,
    }));
    const errors = await errorsFor(CreateEcommerceOrderDto, { items });

    expect(errors.some((error) => error.property === 'items')).toBe(true);
  });

  it('rejects an oversized list of bot functions', async () => {
    const funcionIds = Array.from(
      { length: 101 },
      (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    );
    const errors = await errorsFor(CreateBotQuoteDto, { funcionIds });

    expect(errors.some((error) => error.property === 'funcionIds')).toBe(true);
  });
});
