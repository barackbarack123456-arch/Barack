import { faker } from '@faker-js/faker';
import { addCliente } from './modules/clientesService';
import { addInsumo } from './modules/insumosService';
import { addProveedor } from './modules/proveedoresService';
import { addProyecto } from './modules/proyectosService';
import { addSubproducto } from './modules/subproductosService';
import { UNITS } from '../constants/units';

const seedClientes = async (count = 20) => {
  console.log('Seeding clientes...');
  for (let i = 0; i < count; i++) {
    const cliente = {
      nombre: faker.company.name(),
      direccion: faker.address.streetAddress(),
      telefono: faker.phone.number(),
      email: faker.internet.email(),
    };
    await addCliente(cliente);
  }
  console.log(`${count} clientes seeded.`);
};

const seedProveedores = async (count = 15) => {
  console.log('Seeding proveedores...');
  for (let i = 0; i < count; i++) {
    const proveedor = {
      razonSocial: faker.company.name(),
      direccion: faker.address.streetAddress(),
      telefono: faker.phone.number(),
      email: faker.internet.email(),
      contacto: faker.name.fullName(),
    };
    await addProveedor(proveedor);
  }
  console.log(`${count} proveedores seeded.`);
};

const seedProyectos = async (count = 5) => {
  console.log('Seeding proyectos...');
  for (let i = 0; i < count; i++) {
    const proyecto = {
      codigo: faker.random.alphaNumeric(8).toUpperCase(),
      nombre: faker.commerce.productName(),
    };
    await addProyecto(proyecto);
  }
  console.log(`${count} proyectos seeded.`);
};

const seedInsumos = async (count = 100) => {
  console.log('Seeding insumos...');
  for (let i = 0; i < count; i++) {
    const insumo = {
      codigo: faker.random.alphaNumeric(10).toUpperCase(),
      descripcion: faker.commerce.productDescription(),
      unidad_medida: faker.helpers.arrayElement(UNITS.map(u => u.id)),
      material: faker.commerce.productMaterial(),
      codigo_proveedor: faker.random.alphaNumeric(8),
      imagen: faker.image.imageUrl(640, 480, 'technics', true),
      piezas_por_vehiculo: faker.datatype.number({ min: 1, max: 100 }),
      proceso: faker.lorem.word(),
      aspecto_lc_kd: faker.helpers.arrayElement(['LC', 'KD']),
      color: faker.color.human(),
      materia_prima: faker.commerce.productMaterial(),
      proveedor_materia_prima: faker.company.name(),
    };
    await addInsumo(insumo);
  }
  console.log(`${count} insumos seeded.`);
};

const seedSubproductos = async (count = 50) => {
  console.log('Seeding subproductos...');
  // For simplicity, we are not creating a hierarchy in this seed script.
  // All subproductos will be top-level (id_padre: null).
  for (let i = 0; i < count; i++) {
    const subproducto = {
      nombre: faker.commerce.productName(),
      descripcion: faker.commerce.productDescription(),
      codigo: faker.random.alphaNumeric(10).toUpperCase(),
      peso: `${faker.datatype.number({ min: 1, max: 1000, precision: 0.1 })} kg`,
      medidas: `${faker.datatype.number({ min: 10, max: 200 })}x${faker.datatype.number({ min: 10, max: 200 })}x${faker.datatype.number({ min: 10, max: 200 })} cm`,
      id_padre: null,
      unidad_medida: 'un',
    };
    await addSubproducto(subproducto);
  }
  console.log(`${count} subproductos seeded.`);
};

export const seedDatabase = async () => {
  try {
    console.log('Starting database seed...');
    await seedClientes();
    await seedProveedores();
    await seedProyectos();
    await seedInsumos();
    await seedSubproductos();
    console.log('Database seeded successfully!');
    alert('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    alert('Error seeding database. Check the console for details.');
  }
};
