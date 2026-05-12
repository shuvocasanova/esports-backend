const prisma = require('../config/db');

async function main() {
  const id = 6;
  const updateData = { name: "Updated Admin Script", password: "" };
  
  if (updateData.password === "") {
    delete updateData.password;
  }
  
  console.log('UpdateData:', updateData);
  
  await prisma.user.update({
    where: { id },
    data: updateData
  });
  
  const user = await prisma.user.findUnique({ where: { id } });
  console.log('Password after script update:', JSON.stringify(user.password));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
