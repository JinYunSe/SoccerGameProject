import prisma from '../prisma/index.js';

const table_findFirst = async (table_name, value) => {
  return await prisma[table_name].findFirst({
    where: { ...value },
  });
};

const table_findMany = async (table_name, value) => {
  return await prisma[table_name].findMany({
    where: { ...value },
  });
};

const row_update = async (table_name, where_condition, value, tx) => {
  const db = tx ? tx : prisma;
  await db[table_name].update({
    where: { ...where_condition },
    data: {
      ...value,
    },
  });
};

const row_create = async (table_name, value, tx) => {
  const db = tx ? tx : prisma;
  await db[table_name].create({
    data: {
      ...value,
    },
  });
};

const row_delete = async (table_name, where_condition, tx) => {
  const db = tx ? tx : prisma;
  await db[table_name].delete({
    where: { ...where_condition },
  });
};

// 위의 함수들을 좀 더 잘 활용하면
// 모든 input(배열, 객체, 변수)에 대해
// create, delete, select, update가 동작될 수 있게
// 할 수 있을 것 같은데... 아직은 잘 모르겠습니다...
export { table_findFirst, table_findMany, row_update, row_create, row_delete };
