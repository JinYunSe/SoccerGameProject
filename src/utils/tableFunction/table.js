import prisma from '../prisma/index.js';

const table_findFirst = async (table_name, where_condition, tx) => {
  const db = tx ? tx : prisma;
  return await db[table_name].findFirst({
    where: { ...where_condition },
  });
};

const table_findManyInculde = async (table_name, where_condition, foreign_key, orderBy, tx) => {
  const db = tx ? tx : prisma;
  return await db[table_name].findMany({
    where: { ...where_condition },
    include: { ...foreign_key },
    ...orderBy,
  });
};

const table_findMany = async (table_name, where_condition, select_key, orderBy, tx) => {
  const db = tx ? tx : prisma;
  return await db[table_name].findMany({
    where: { ...where_condition },
    select: { ...select_key },
    ...orderBy,
  });
};

const row_update = async (table_name, where_condition, value, tx) => {
  const db = tx ? tx : prisma;
  return await db[table_name].update({
    where: { ...where_condition },
    data: {
      ...value,
    },
  });
};

const row_updateMany = async (table_name, value, tx) => {
  const db = tx ? tx : prisma;
  return await db[table_name].updateMany({
    value,
  });
};

const row_create = async (table_name, value, tx) => {
  const db = tx ? tx : prisma;
  return await db[table_name].create({
    data: {
      ...value,
    },
  });
};

const row_delete = async (table_name, where_condition, tx) => {
  const db = tx ? tx : prisma;
  return await db[table_name].delete({
    where: { ...where_condition },
  });
};

export {
  table_findFirst,
  table_findMany,
  row_update,
  row_create,
  row_delete,
  row_updateMany,
  table_findManyInculde,
};
