"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes, fullName }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
    this.fullName = this.fullName()
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** DOCSTRING ME */
  static async getName(name) {
    const firstName = name[0];
    const lastName = name[1];
    const results = await db.query(
      `SELECT first_name AS "firstName",
              last_name AS "lastName",
              id
        FROM customers
        WHERE first_name = $1
        AND last_name = $2`,
      [firstName, lastName]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${firstName} ${lastName}`);
      err.status = 404;
      throw err;
    }
    return customer;
  }

/** DOCSTRING ME TOO */
  static async getNames(name) {

    const results = await db.query(
      `SELECT first_name, last_name, id
        FROM customers
        WHERE first_name = $1
        OR last_name = $1`,
        [name[0]]
    );

    const customers = results.rows;

    if (customers === undefined) {
      const err = new Error(`No such customer: ${name}`);
      err.status = 404;
      throw err;
    }
    return customers
  }
  /** combines this customers firstname and lastname */

  fullName() {
    const fullName = `${this.firstName} ${this.lastName}`
    return fullName;
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

/** SQL query for top ten customers by reservation amount */
  static async topTen() {
    const results = await db.query(
      `SELECT first_name, last_name, COUNT(reservations.id) as num, customers.id
      FROM customers
      JOIN reservations
      ON reservations.customer_id = customers.id
      GROUP BY first_name, last_name, customers.id
      ORDER BY num DESC
      LIMIT 10`
    )
    return results.rows;
  }


  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }
}

module.exports = Customer;
