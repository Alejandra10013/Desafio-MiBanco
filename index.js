const { Pool } = require("pg");
const Cursor = require("pg-cursor");

const config = {
    user: "-",
    host: "-",
    password: "-",
    database: "Banco",
    port: "-",
    max: 20,
    idleTimeoutMillis: 4000,
    connectionTimeoutMillis: 0
}

const pool = new Pool(config);

//console.log("conectado a Banco DB")

const nuevaTransaccion = async () => {
    pool.connect(async (error, client, release) => {
        if (error) {
            console.log("Error en la conexion. " + error);
        } else {
            try {
                await client.query("begin")

                const descontar = `update cuentas set saldo = saldo - ${monto} where id = ${cuenta1} returning *;`;
                const descuento = await client.query(descontar);

                const acreditar = `update cuentas set saldo = saldo + ${monto} where id = ${cuenta2} returning *;`;
                const acreditacion = await client.query(acreditar);

                const fechaT = new Date();
                const registroT = `insert into transacciones (descripcion, fecha, monto, cuenta) values ('Transacción', '${fechaT.toLocaleDateString()}', ${monto}, ${cuenta1}) returning *;`;
                const transaccion = await client.query(registroT);

                console.log("Descuento realizado con exito: ", descuento.rows[0]);
                console.log("Acreditación realizado con exito: ", acreditacion.rows[0]);
                console.log("Transaccion realizado con exito: ", transaccion.rows[0]);

                await client.query("commit");
            } catch (error) {
                await client.query("rollback");
                console.log("Transaccion Fallida.");
                console.log("Error código: " + error.code);
                console.log("Detalle: " + error.detail);
            } finally {
                release()
                pool.end()
            }
        }
    })
}

const consultaTransacciones = async () => {
    pool.connect(async (error, client, release) => {
        if (error) {
            console.log("Error en la conexion. " + error);
        } else {
            try {
                const consulta = new Cursor(`select * from cuentas where id = ${cuenta1}`);
                const cursor = client.query(consulta);

                cursor.read(10, (err, rows) => {
                    console.log(rows);
                    cursor.close()
                    release()
                    pool.end()
                })
                console.log("Consulta Exitosa.");
            } catch (error) {
                console.log("Consulta Fallida.");
                console.log("Error código: " + error.code);
                console.log("Detalle: " + error.detail);
            }
        }
    })
}

const consultaSaldo = async () => {
    pool.connect(async (error, client, release) => {
        if (error) {
            console.log("Error en la conexion. " + error);
        } else {
            try {
                const consulta = new Cursor(`select * from cuenta where id = ${cuenta1}`);
                const cursor = client.query(consulta);

                cursor.read(1, (err, rows) => {
                    console.log(`El saldo de la cuenta ${rows[0].id} es: ${rows[0].saldo}`);
                    cursor.close();
                    release();
                    pool.end();
                })
                console.log("Consulta Exitosa.");
            } catch (error) {
                console.log("Consulta Fallida.");
                console.log("Error código: " + error.code);
                console.log("Detalle: " + error.detail);
            }
        }
    })
}


const args = process.argv.slice(2);
let comando = args[0];
let cuenta1 = args[1];
let cuenta2 = args[2];
let monto = args[3];

switch (comando) {
    case "nuevaTransaccion":
        nuevaTransaccion(cuenta1, cuenta2, monto)
        // Exito | node index.js nuevaTransaccion '2' '3' '10000'
        // Error | node index.js nuevaTransaccion '2' '3'
        break;

    case "transacciones":
        consultaTransacciones(cuenta1)
        // Exito | node index.js transacciones '3'
        break;

    case "saldo":
        consultaSaldo(cuenta1)
        // Exito | node index.js saldo 1
        break;

    default:
        break;
}
