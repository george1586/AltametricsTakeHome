import "dotenv/config"
import { db } from '../src/db/db.ts';
import bcrypt from "bcrypt";

const vendors = ["Digi", "Orange", "McDonalds", "Starlink", "Nvidia"];

const seedUsers = [
    { email: "demo@altametrics.com", name: "Demo User", password: "Password123!", invoiceCount: 25 },
    { email: "alice@altametrics.com", name: "Alice Pop", password: "Password123!", invoiceCount: 8 },
    { email: "bob@altametrics.com", name: "Bob Ionescu", password: "Password123!", invoiceCount: 1 },
];



function makeInvoices(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        vendor_name: vendors[i % vendors.length],
        amount: (1 + Math.random() * 999).toFixed(2),
        due_date: new Date(2026, 11, 16 + i),
        description: "Just some random text don't mind me",
        paid: i % 2 === 0,
    }));
}

async function main() {

    for (const u of seedUsers) {
        await db.orm.public.User.where({ email: u.email }).deleteAll();
        await db.orm.public.User.create({
            email: u.email,
            password: await bcrypt.hash(u.password, 10),
            name: u.name,
            invoices: (inv) => inv.create(makeInvoices(u.invoiceCount)),
        });
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => db.close())
